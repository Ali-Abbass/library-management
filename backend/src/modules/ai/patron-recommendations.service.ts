import { Injectable } from '@nestjs/common';
import { BookRepository } from '../books/repositories/book.repo';
import { BookEntity } from '../books/entities/book.entity';
import { LoanRepository } from '../loans/repositories/loan.repo';
import { CopyRepository } from '../copies/repositories/copy.repo';
import { GeminiClient } from './gemini.client';

type RecommendedBook = {
  id: string;
  title?: string;
  code?: string;
  reason: string;
  confidence: number;
};

type RecommendationPayload = {
  mode: 'personalized' | 'starter';
  generatedAt: string;
  items: RecommendedBook[];
};

type CachedRecommendation = {
  expiresAt: number;
  payload: RecommendationPayload;
};

@Injectable()
export class PatronRecommendationsService {
  private readonly cache = new Map<string, CachedRecommendation>();
  private readonly ttlMs = 5 * 60 * 1000;

  constructor(
    private readonly booksRepo: BookRepository,
    private readonly loansRepo: LoanRepository,
    private readonly copiesRepo: CopyRepository,
    private readonly gemini: GeminiClient
  ) {}

  async recommendForUser(userId: string, forceRefresh = false): Promise<RecommendationPayload> {
    const now = Date.now();
    const cached = this.cache.get(userId);
    if (!forceRefresh && cached && cached.expiresAt > now) {
      return cached.payload;
    }

    const payload = await this.computeRecommendations(userId);
    this.cache.set(userId, { expiresAt: now + this.ttlMs, payload });
    return payload;
  }

  private async computeRecommendations(userId: string): Promise<RecommendationPayload> {
    const loans = await this.loansRepo.findByUser(userId);
    const recentLoans = loans.slice(0, 10);
    const copyIds = Array.from(new Set(recentLoans.map((loan) => loan.copyId)));
    const copies = await Promise.all(copyIds.map((id) => this.copiesRepo.findById(id)));
    const borrowedBookIds = Array.from(
      new Set(copies.filter((copy): copy is NonNullable<typeof copy> => !!copy).map((copy) => copy.bookId))
    );
    const borrowedBooks = await Promise.all(borrowedBookIds.map((id) => this.booksRepo.findById(id)));

    const prefs = this.extractPreferences(borrowedBooks);
    const candidates = await this.collectCandidates(prefs, borrowedBookIds);

    const mode: RecommendationPayload['mode'] = borrowedBookIds.length > 0 ? 'personalized' : 'starter';
    const aiChosen = await this.rankWithAi(mode, prefs, borrowedBooks, candidates);
    const fallback = this.rankFallback(candidates, prefs);

    const merged = (aiChosen.length > 0 ? aiChosen : fallback)
      .slice(0, 6)
      .map((item) => ({
        ...item,
        confidence: Math.max(0.35, Math.min(1, Number(item.confidence.toFixed(2))))
      }));

    return {
      mode,
      generatedAt: new Date().toISOString(),
      items: merged
    };
  }

  private extractPreferences(books: Array<BookEntity | null>) {
    const genreScores = new Map<string, number>();
    const tagScores = new Map<string, number>();
    const authorScores = new Map<string, number>();

    books.forEach((book, index) => {
      if (!book) return;
      const weight = Math.max(1, 5 - index);
      (book.genres ?? []).forEach((genre) => genreScores.set(genre, (genreScores.get(genre) ?? 0) + weight));
      (book.tags ?? []).forEach((tag) => tagScores.set(tag, (tagScores.get(tag) ?? 0) + weight));
      (book.authors ?? []).forEach((author) => authorScores.set(author, (authorScores.get(author) ?? 0) + weight));
    });

    const sortEntries = (entries: Map<string, number>) =>
      Array.from(entries.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([value]) => value);

    return {
      topGenres: sortEntries(genreScores).slice(0, 3),
      topTags: sortEntries(tagScores).slice(0, 4),
      topAuthors: sortEntries(authorScores).slice(0, 3)
    };
  }

  private async collectCandidates(
    prefs: { topGenres: string[]; topTags: string[]; topAuthors: string[] },
    excludeBookIds: string[]
  ): Promise<BookEntity[]> {
    const batches = await Promise.all([
      this.booksRepo.search({ status: 'active', pageSize: '18' }),
      prefs.topGenres[0] ? this.booksRepo.search({ status: 'active', pageSize: '14', genres: prefs.topGenres[0] }) : Promise.resolve([]),
      prefs.topTags[0] ? this.booksRepo.search({ status: 'active', pageSize: '14', tags: prefs.topTags[0] }) : Promise.resolve([])
    ]);

    const byId = new Map<string, BookEntity>();
    batches.flat().forEach((book) => {
      if (!book || excludeBookIds.includes(book.id) || book.status !== 'active') {
        return;
      }
      byId.set(book.id, book);
    });

    return Array.from(byId.values()).slice(0, 20);
  }

  private async rankWithAi(
    mode: 'personalized' | 'starter',
    prefs: { topGenres: string[]; topTags: string[]; topAuthors: string[] },
    borrowedBooks: Array<BookEntity | null>,
    candidates: BookEntity[]
  ): Promise<RecommendedBook[]> {
    if (candidates.length === 0) {
      return [];
    }

    const loanContext = borrowedBooks
      .filter((book): book is BookEntity => !!book)
      .slice(0, 5)
      .map((book) => `${book.id}|${book.title}`)
      .join(', ');

    const prompt = [
      'You are a library recommendation assistant.',
      'Choose up to 6 books the patron is most likely to borrow next.',
      'Return strict JSON array only: [{"id":"...","reason":"...","confidence":0.00}]',
      'Reason should be concise, practical, and under 90 characters.',
      'Confidence must be between 0 and 1.',
      `Mode: ${mode}`,
      `Preferences genres=${prefs.topGenres.join('|') || 'none'} tags=${prefs.topTags.join('|') || 'none'} authors=${prefs.topAuthors.join('|') || 'none'}`,
      `Recent loans: ${loanContext || 'none'}`,
      'Candidates:',
      ...candidates.map((book) => `- ${book.id} | ${book.title} | genres=${(book.genres ?? []).join(',')} | tags=${(book.tags ?? []).join(',')}`)
    ].join('\n');

    const text = await this.gemini.generateText(prompt);
    try {
      const parsed = JSON.parse(text) as Array<{ id?: string; reason?: string; confidence?: number }>;
      return parsed
        .filter((item) => item.id && candidates.some((candidate) => candidate.id === item.id))
        .slice(0, 6)
        .map((item, index) => {
          const book = candidates.find((candidate) => candidate.id === item.id)!;
          return {
            id: book.id,
            title: book.title,
            code: book.code,
            reason: (item.reason ?? 'Good match for your reading interests').slice(0, 90),
            confidence: typeof item.confidence === 'number' ? item.confidence : 0.9 - index * 0.1
          };
        });
    } catch {
      return [];
    }
  }

  private rankFallback(
    candidates: BookEntity[],
    prefs: { topGenres: string[]; topTags: string[]; topAuthors: string[] }
  ): RecommendedBook[] {
    const score = (book: BookEntity) => {
      const genreHits = (book.genres ?? []).filter((genre) => prefs.topGenres.includes(genre)).length;
      const tagHits = (book.tags ?? []).filter((tag) => prefs.topTags.includes(tag)).length;
      const authorHits = (book.authors ?? []).filter((author) => prefs.topAuthors.includes(author)).length;
      return genreHits * 3 + tagHits * 2 + authorHits * 2;
    };

    return candidates
      .map((book) => ({ book, score: score(book) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item, index) => ({
        id: item.book.id,
        title: item.book.title,
        code: item.book.code,
        reason:
          item.score > 0
            ? 'Matches your recent borrowing patterns'
            : 'Popular in the catalog right now',
        confidence: 0.85 - index * 0.08
      }));
  }
}

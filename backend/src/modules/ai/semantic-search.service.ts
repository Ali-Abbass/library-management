import { Injectable } from '@nestjs/common';
import { BookRepository } from '../books/repositories/book.repo';
import { GeminiClient } from './gemini.client';

type RankedBook = {
  id: string;
  title?: string;
  code?: string;
  score: number;
};

@Injectable()
export class SemanticSearchService {
  constructor(
    private readonly booksRepo: BookRepository,
    private readonly gemini: GeminiClient
  ) {}

  private normalize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }

  private scoreByOverlap(query: string, text: string): number {
    const a = new Set(this.normalize(query));
    const b = new Set(this.normalize(text));
    if (!a.size || !b.size) return 0;
    let overlap = 0;
    a.forEach((token) => {
      if (b.has(token)) overlap += 1;
    });
    return overlap / Math.max(a.size, 1);
  }

  private parseRanking(text: string, ids: string[]): string[] {
    if (!text) return [];
    const byId = ids.filter((id) => text.includes(id));
    if (byId.length > 0) return byId;
    try {
      const parsed = JSON.parse(text) as Array<{ id?: string }>;
      return parsed
        .map((item) => item.id ?? '')
        .filter((id) => ids.includes(id));
    } catch {
      return [];
    }
  }

  async search(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      return { query: '', results: [] };
    }

    const books = await this.booksRepo.search({ q: trimmed, pageSize: '15' });
    const seedResults: RankedBook[] = books.map((book, index) => ({
      id: book.id,
      title: book.title,
      code: book.code,
      score: Math.max(1 - index * 0.06, 0.25) + this.scoreByOverlap(trimmed, `${book.title} ${book.description ?? ''}`)
    }));

    if (seedResults.length <= 1) {
      return { query: trimmed, results: seedResults };
    }

    const candidates = seedResults.slice(0, 8);
    const rankingPrompt = [
      'Rank the following books by semantic relevance to the query.',
      'Return only a JSON array with book ids in ranked order.',
      `Query: ${trimmed}`,
      'Candidates:',
      ...candidates.map((item) => `- ${item.id}: ${item.title}`)
    ].join('\n');
    const rankingText = await this.gemini.generateText(rankingPrompt);
    const rankedIds = this.parseRanking(
      rankingText,
      candidates.map((item) => item.id)
    );

    if (rankedIds.length > 0) {
      const scoreById = new Map(seedResults.map((item) => [item.id, item]));
      const reranked = rankedIds
        .map((id, index) => {
          const match = scoreById.get(id);
          if (!match) return null;
          return {
            ...match,
            score: Math.max(1 - index * 0.08, 0.35)
          };
        })
        .filter((item): item is RankedBook => !!item);
      const rest = seedResults.filter((item) => !rankedIds.includes(item.id));
      return { query: trimmed, results: [...reranked, ...rest].slice(0, 10) };
    }

    const results = seedResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        score: Number(item.score.toFixed(3))
      }));
    return { query: trimmed, results };
  }

  async suggestQuery(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      return { original: '', suggested: '', reasons: [] as string[] };
    }
    const prompt = [
      'Rewrite this library search query to improve recall and precision.',
      'Return strict JSON object: {"suggested":"...","reasons":["...","..."]}',
      'Use max 12 words for suggested.',
      `Query: ${trimmed}`
    ].join('\n');
    const answer = await this.gemini.generateText(prompt);
    try {
      const parsed = JSON.parse(answer) as { suggested?: string; reasons?: string[] };
      return {
        original: trimmed,
        suggested: parsed.suggested?.trim() || trimmed,
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 2) : []
      };
    } catch {
      return { original: trimmed, suggested: trimmed, reasons: [] as string[] };
    }
  }
}

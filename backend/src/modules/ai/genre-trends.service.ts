import { Injectable } from '@nestjs/common';
import { BookRepository } from '../books/repositories/book.repo';
import { CopyRepository } from '../copies/repositories/copy.repo';
import { LoanRepository } from '../loans/repositories/loan.repo';
import { GeminiClient } from './gemini.client';

@Injectable()
export class GenreTrendsService {
  constructor(
    private readonly loansRepo: LoanRepository,
    private readonly copiesRepo: CopyRepository,
    private readonly booksRepo: BookRepository,
    private readonly gemini: GeminiClient
  ) {}

  async getTrends() {
    const loans = await this.loansRepo.listAll();
    const uniqueCopyIds = [...new Set(loans.map((loan) => loan.copyId))];
    const copies = await Promise.all(uniqueCopyIds.map((id) => this.copiesRepo.findById(id)));
    const uniqueBookIds = [
      ...new Set(
        copies
          .filter((copy): copy is NonNullable<typeof copy> => !!copy)
          .map((copy) => copy.bookId)
      )
    ];

    const books = await Promise.all(uniqueBookIds.map((id) => this.booksRepo.findById(id)));

    const genres: Record<string, number> = {};
    books
      .filter((book): book is NonNullable<typeof book> => !!book)
      .forEach((book) => {
        (book.genres ?? []).forEach((genre) => {
          genres[genre] = (genres[genre] ?? 0) + 1;
        });
      });

    const top = Object.entries(genres)
      .map(([genre, score]) => ({ genre, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (!top.length) {
      return [];
    }

    const prompt = [
      'Provide one short insight sentence for each genre based on its trend score.',
      'Return strict JSON object where keys are genres and values are <= 12 words.',
      ...top.map((item) => `${item.genre}: ${item.score}`)
    ].join('\n');
    const aiText = await this.gemini.generateText(prompt);

    try {
      const parsed = JSON.parse(aiText) as Record<string, string>;
      return top.map((item) => ({
        ...item,
        insight: (parsed[item.genre] ?? '').slice(0, 120)
      }));
    } catch {
      return top;
    }
  }
}

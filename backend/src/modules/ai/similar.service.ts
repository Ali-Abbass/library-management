import { Injectable } from '@nestjs/common';
import { BookRepository } from '../books/repositories/book.repo';
import { GeminiClient } from './gemini.client';

@Injectable()
export class SimilarBooksService {
  constructor(
    private readonly booksRepo: BookRepository,
    private readonly gemini: GeminiClient
  ) {}

  private parseOrderedIds(text: string, allowedIds: string[]): string[] {
    if (!text) return [];
    return allowedIds.filter((id) => text.includes(id));
  }

  async getSimilar(bookId: string): Promise<Array<{ id: string; title?: string; code?: string; reason: string }>> {
    const book = await this.booksRepo.findById(bookId);
    if (!book) return [];

    const genres = book.genres ?? [];
    const tags = book.tags ?? [];
    const query: Record<string, string | string[]> = { pageSize: '12' };
    if (genres[0]) query.genres = genres[0];
    if (tags[0]) query.tags = tags[0];
    const candidates = await this.booksRepo.search(query);

    const filtered = candidates
      .filter((item) => item.id !== bookId)
      .slice(0, 8);

    if (filtered.length === 0) {
      return [];
    }

    const prompt = [
      'Choose up to 5 most similar books to the source book.',
      'Return only JSON array of objects: [{"id":"...","reason":"..."}]',
      `Source: ${book.id} | ${book.title} | genres=${(book.genres ?? []).join(',')} | tags=${(book.tags ?? []).join(',')}`,
      'Candidates:',
      ...filtered.map((item) => `- ${item.id} | ${item.title} | genres=${(item.genres ?? []).join(',')} | tags=${(item.tags ?? []).join(',')}`)
    ].join('\n');

    const aiText = await this.gemini.generateText(prompt);
    try {
      const parsed = JSON.parse(aiText) as Array<{ id?: string; reason?: string }>;
      const safe = parsed
        .filter((item) => item.id && filtered.some((bookItem) => bookItem.id === item.id))
        .slice(0, 5)
        .map((item) => ({
          id: item.id as string,
          title: filtered.find((bookItem) => bookItem.id === item.id)?.title,
          code: filtered.find((bookItem) => bookItem.id === item.id)?.code,
          reason: (item.reason || 'semantic-match').slice(0, 64)
        }));
      if (safe.length > 0) return safe;
    } catch {
      const orderedIds = this.parseOrderedIds(
        aiText,
        filtered.map((item) => item.id)
      );
      if (orderedIds.length > 0) {
        return orderedIds.slice(0, 5).map((id) => ({
          id,
          title: filtered.find((item) => item.id === id)?.title,
          code: filtered.find((item) => item.id === id)?.code,
          reason: genres.length ? `genre:${genres[0]}` : 'tag-match'
        }));
      }
    }

    return filtered.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      code: item.code,
      reason: genres.length ? `genre:${genres[0]}` : 'tag-match'
    }));
  }
}

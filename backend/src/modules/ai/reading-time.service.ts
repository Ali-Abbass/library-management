import { Injectable } from '@nestjs/common';
import { BookRepository } from '../books/repositories/book.repo';

@Injectable()
export class ReadingTimeService {
  constructor(private readonly booksRepo: BookRepository) {}

  async estimateForBook(bookId: string) {
    const book = await this.booksRepo.findById(bookId);
    if (!book?.pageCount) return null;
    const minutes = Math.ceil(book.pageCount * 1.5);
    return { minutes };
  }
}

import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { BookRepository } from '../../src/modules/books/repositories/book.repo';
import { CopyRepository } from '../../src/modules/copies/repositories/copy.repo';

describe('Books Integration', () => {
  it('returns availability counts for a book', async () => {
    const booksRepo: Partial<BookRepository> = {
      search: async () => [
        { id: 'book-1', code: 'BK-TEST01', title: 'Test Book', authors: ['Author'], status: 'active' }
      ],
      findById: async () => ({ id: 'book-1', code: 'BK-TEST01', title: 'Test Book', authors: ['Author'], status: 'active' })
    };

    const copyRepo: Partial<CopyRepository> = {
      findByBookId: async () => [
        { id: 'copy-1', bookId: 'book-1', status: 'available', createdAt: new Date().toISOString() },
        { id: 'copy-2', bookId: 'book-1', status: 'checked_out', createdAt: new Date().toISOString() },
        { id: 'copy-3', bookId: 'book-1', status: 'archived', createdAt: new Date().toISOString() }
      ]
    };

    const app = await createTestApp(
      new Map([
        [BookRepository, booksRepo],
        [CopyRepository, copyRepo]
      ])
    );

    const res = await request(app.getHttpServer()).get('/api/v1/books/book-1').expect(200);
    expect(res.body.availability).toMatchObject({ total: 3, available: 1, checkedOut: 1, archived: 1 });

    await closeTestApp(app);
  });
});

import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { BookRepository } from '../../src/modules/books/repositories/book.repo';
import { CopyRepository } from '../../src/modules/copies/repositories/copy.repo';

describe('Books API Contracts', () => {
  it('supports search and detail endpoints', async () => {
    const booksRepo: Partial<BookRepository> = {
      search: async () => [
        {
          id: 'book-1',
          code: 'BK-TEST01',
          title: 'Test Book',
          authors: ['Author'],
          status: 'active'
        }
      ],
      findById: async () => ({
        id: 'book-1',
        code: 'BK-TEST01',
        title: 'Test Book',
        authors: ['Author'],
        status: 'active'
      })
    };

    const copyRepo: Partial<CopyRepository> = {
      findByBookId: async () => [
        { id: 'copy-1', bookId: 'book-1', status: 'available', createdAt: new Date().toISOString() }
      ]
    };

    const app = await createTestApp(
      new Map([
        [BookRepository, booksRepo],
        [CopyRepository, copyRepo]
      ])
    );

    const searchRes = await request(app.getHttpServer()).get('/api/v1/books').expect(200);
    expect(Array.isArray(searchRes.body)).toBe(true);
    expect(searchRes.body[0]).toMatchObject({
      id: 'book-1',
      title: 'Test Book',
      availability: { total: 1, available: 1 }
    });

    const detailRes = await request(app.getHttpServer()).get('/api/v1/books/book-1').expect(200);
    expect(detailRes.body.book).toMatchObject({ id: 'book-1', title: 'Test Book' });
    expect(detailRes.body.availability).toMatchObject({ total: 1, available: 1 });

    await closeTestApp(app);
  });
});

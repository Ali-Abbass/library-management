import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { BookRepository } from '../../src/modules/books/repositories/book.repo';

describe('Books Archive Contracts', () => {
  it('supports archive and restore endpoints', async () => {
    const booksRepo: Partial<BookRepository> = {
      updateStatus: async (id: string, status: 'active' | 'archived') => ({
        id,
        code: 'BK-TEST01',
        title: 'Book',
        authors: ['Author'],
        status
      })
    };

    const app = await createTestApp(new Map([[BookRepository, booksRepo]]));

    const archiveRes = await request(app.getHttpServer()).post('/api/v1/books/book-1/archive').expect(201);
    expect(archiveRes.body.status).toBe('archived');

    const restoreRes = await request(app.getHttpServer()).post('/api/v1/books/book-1/restore').expect(201);
    expect(restoreRes.body.status).toBe('active');

    await closeTestApp(app);
  });
});

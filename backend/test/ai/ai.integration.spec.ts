import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { BookRepository } from '../../src/modules/books/repositories/book.repo';
import { CopyRepository } from '../../src/modules/copies/repositories/copy.repo';
import { LoanRepository } from '../../src/modules/loans/repositories/loan.repo';

describe('AI Integration', () => {
  it('returns semantic search and recommendations', async () => {
    const booksRepo: Partial<BookRepository> = {
      search: async () => [
        { id: 'book-1', code: 'BK-TEST01', title: 'Test', authors: ['A'], status: 'active', genres: ['tech'], tags: ['systems'] }
      ],
      findById: async () => ({
        id: 'book-1',
        code: 'BK-TEST01',
        title: 'Test',
        authors: ['A'],
        status: 'active',
        genres: ['tech'],
        tags: ['systems'],
        pageCount: 200
      })
    };

    const copiesRepo: Partial<CopyRepository> = {
      findById: async () => ({ id: 'copy-1', bookId: 'book-1', status: 'available', createdAt: '' })
    };

    const loansRepo: Partial<LoanRepository> = {
      listAll: async () => [
        {
          id: 'loan-1',
          userId: 'user-1',
          copyId: 'copy-1',
          status: 'active',
          checkedOutAt: '',
          dueAt: ''
        }
      ]
    };

    const app = await createTestApp(
      new Map<unknown, unknown>([
        [BookRepository, booksRepo],
        [CopyRepository, copiesRepo],
        [LoanRepository, loansRepo]
      ])
    );

    const searchRes = await request(app.getHttpServer())
      .post('/api/v1/ai/semantic-search')
      .send({ query: 'systems' })
      .expect(201);
    expect(searchRes.body.results.length).toBeGreaterThan(0);

    const readingRes = await request(app.getHttpServer()).get('/api/v1/ai/reading-time/book-1').expect(200);
    expect(readingRes.body.minutes).toBeGreaterThan(0);

    const trendsRes = await request(app.getHttpServer()).get('/api/v1/ai/genre-trends').expect(200);
    expect(trendsRes.body.length).toBeGreaterThan(0);

    await closeTestApp(app);
  });
});

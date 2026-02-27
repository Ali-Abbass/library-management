import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { BooksService } from '../../src/modules/books/books.service';
import { AnalyticsService } from '../../src/modules/analytics/analytics.service';

describe('Admin Catalog & Analytics Contracts', () => {
  it('supports admin catalog endpoints', async () => {
    const booksService: Partial<BooksService> = {
      create: async (input: any) => ({ id: 'book-1', ...input, status: 'active' })
    };
    const analyticsService: Partial<AnalyticsService> = {
      overview: async () => ({ totalLoans: 0, topBorrowers: [], mostBorrowedBooks: [] })
    };

    const app = await createTestApp(
      new Map([
        [BooksService, booksService],
        [AnalyticsService, analyticsService]
      ])
    );

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/books')
      .send({ title: 'New Book', authors: ['A'] })
      .expect(201);
    expect(createRes.body.id).toBe('book-1');

    const analyticsRes = await request(app.getHttpServer()).get('/api/v1/analytics/overview').expect(200);
    expect(analyticsRes.body.totalLoans).toBe(0);

    await closeTestApp(app);
  });
});

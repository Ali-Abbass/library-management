import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { BookRepository } from '../../src/modules/books/repositories/book.repo';
import { CopyRepository } from '../../src/modules/copies/repositories/copy.repo';
import { LoanRepository } from '../../src/modules/loans/repositories/loan.repo';

describe('Books Archive Integration', () => {
  it('prevents checkout of archived books', async () => {
    const booksRepo: Partial<BookRepository> = {
      findById: async () => ({
        id: 'book-1',
        code: 'BK-TEST01',
        title: 'Archived Book',
        authors: ['Author'],
        status: 'archived'
      })
    };

    const copyRepo: Partial<CopyRepository> = {
      findById: async () => ({ id: 'copy-1', bookId: 'book-1', status: 'available', createdAt: '' })
    };

    const loansRepo: Partial<LoanRepository> = {};

    const app = await createTestApp(
      new Map([
        [BookRepository, booksRepo],
        [CopyRepository, copyRepo],
        [LoanRepository, loansRepo]
      ])
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/loans/checkout')
      .send({ copyId: 'copy-1' });

    expect(res.status).toBe(500);
    expect(res.body.message).toContain('archived');

    await closeTestApp(app);
  });
});

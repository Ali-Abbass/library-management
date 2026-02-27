import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { BookRepository } from '../../src/modules/books/repositories/book.repo';
import { CopyRepository } from '../../src/modules/copies/repositories/copy.repo';
import { LoanRepository } from '../../src/modules/loans/repositories/loan.repo';

describe('Loans Integration', () => {
  it('enforces availability and due date defaults', async () => {
    const booksRepo: Partial<BookRepository> = {
      findById: async () => ({ id: 'book-1', code: 'BK-TEST01', title: 'Book', authors: ['A'], status: 'active' })
    };

    const copyRepo: Partial<CopyRepository> = {
      findById: async () => ({ id: 'copy-1', bookId: 'book-1', status: 'available', createdAt: '' }),
      markCheckedOut: async () => ({ id: 'copy-1', bookId: 'book-1', status: 'checked_out', createdAt: '' })
    };

    const loansRepo: Partial<LoanRepository> = {
      findActiveByCopy: async () => null,
      create: async (input: any) => ({
        id: 'loan-1',
        copyId: input.copyId,
        userId: input.userId,
        status: 'active',
        checkedOutAt: new Date().toISOString(),
        dueAt: input.dueAt
      })
    };

    const app = await createTestApp(
      new Map<unknown, unknown>([
        [BookRepository, booksRepo],
        [CopyRepository, copyRepo],
        [LoanRepository, loansRepo]
      ])
    );

    const checkoutRes = await request(app.getHttpServer())
      .post('/api/v1/loans/checkout')
      .send({ copyId: 'copy-1' })
      .expect(201);
    expect(checkoutRes.body.dueAt).toBeDefined();

    await closeTestApp(app);
  });

  it('blocks checkout when copy is unavailable', async () => {
    const booksRepo: Partial<BookRepository> = {
      findById: async () => ({ id: 'book-1', code: 'BK-TEST01', title: 'Book', authors: ['A'], status: 'active' })
    };

    const copyRepo: Partial<CopyRepository> = {
      findById: async () => ({ id: 'copy-1', bookId: 'book-1', status: 'checked_out', createdAt: '' })
    };

    const app = await createTestApp(
      new Map<unknown, unknown>([
        [BookRepository, booksRepo],
        [CopyRepository, copyRepo],
        [LoanRepository, {}]
      ])
    );

    const res = await request(app.getHttpServer()).post('/api/v1/loans/checkout').send({ copyId: 'copy-1' });
    expect(res.status).toBe(500);

    await closeTestApp(app);
  });
});

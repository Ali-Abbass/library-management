import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { BookRepository } from '../../src/modules/books/repositories/book.repo';
import { CopyRepository } from '../../src/modules/copies/repositories/copy.repo';
import { LoanRepository } from '../../src/modules/loans/repositories/loan.repo';

describe('Loans API Contracts', () => {
  it('supports checkout and return endpoints', async () => {
    const booksRepo: Partial<BookRepository> = {
      findById: async () => ({ id: 'book-1', code: 'BK-TEST01', title: 'Book', authors: ['A'], status: 'active' })
    };

    const copyRepo: Partial<CopyRepository> = {
      findById: async () => ({ id: 'copy-1', bookId: 'book-1', status: 'available', createdAt: '' }),
      markCheckedOut: async () => ({ id: 'copy-1', bookId: 'book-1', status: 'checked_out', createdAt: '' }),
      updateStatus: async () => ({ id: 'copy-1', bookId: 'book-1', status: 'available', createdAt: '' })
    };

    const loansRepo: Partial<LoanRepository> = {
      findActiveByCopy: async () => null,
      create: async () => ({
        id: 'loan-1',
        copyId: 'copy-1',
        userId: 'test-user',
        status: 'active',
        checkedOutAt: new Date().toISOString(),
        dueAt: new Date().toISOString()
      }),
      findById: async () => ({
        id: 'loan-1',
        copyId: 'copy-1',
        userId: 'test-user',
        status: 'active',
        checkedOutAt: new Date().toISOString(),
        dueAt: new Date().toISOString()
      }),
      update: async () => ({
        id: 'loan-1',
        copyId: 'copy-1',
        userId: 'test-user',
        status: 'returned',
        checkedOutAt: new Date().toISOString(),
        dueAt: new Date().toISOString(),
        returnedAt: new Date().toISOString()
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
    expect(checkoutRes.body.status).toBe('active');

    const returnRes = await request(app.getHttpServer())
      .post('/api/v1/loans/return')
      .send({ loanId: 'loan-1' })
      .expect(201);
    expect(returnRes.body.status).toBe('returned');

    await closeTestApp(app);
  });
});

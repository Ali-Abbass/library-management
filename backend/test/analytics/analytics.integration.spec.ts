import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { LoanRepository } from '../../src/modules/loans/repositories/loan.repo';
import { CopyRepository } from '../../src/modules/copies/repositories/copy.repo';
import { ActivityRepository } from '../../src/modules/analytics/repositories/activity.repo';
import { BookRepository } from '../../src/modules/books/repositories/book.repo';

describe('Analytics Integration', () => {
  it('aggregates analytics and exports CSV', async () => {
    const loansRepo: Partial<LoanRepository> = {
      listByRange: async () => [
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

    const copiesRepo: Partial<CopyRepository> = {
      findById: async () => ({ id: 'copy-1', bookId: 'book-1', status: 'available', createdAt: '' })
    };

    const activityRepo: Partial<ActivityRepository> = {
      list: async () => [
        {
          id: 'act-1',
          actorId: 'user-1',
          action: 'loan.checkout',
          entityType: 'loan',
          entityId: 'loan-1',
          occurredAt: new Date().toISOString()
        }
      ]
    };

    const booksRepo: Partial<BookRepository> = {
      findById: async () => ({ id: 'book-1', code: 'BK-TEST01', title: 'Test', authors: ['A'], status: 'active' })
    };

    const app = await createTestApp(
      new Map([
        [LoanRepository, loansRepo],
        [CopyRepository, copiesRepo],
        [ActivityRepository, activityRepo],
        [BookRepository, booksRepo]
      ])
    );

    const overviewRes = await request(app.getHttpServer()).get('/api/v1/analytics/overview').expect(200);
    expect(overviewRes.body.totalLoans).toBe(1);

    const exportRes = await request(app.getHttpServer()).get('/api/v1/analytics/export').expect(200);
    expect(exportRes.text).toContain('user,action');

    await closeTestApp(app);
  });
});

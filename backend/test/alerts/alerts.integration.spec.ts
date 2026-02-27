import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { LoanRepository } from '../../src/modules/loans/repositories/loan.repo';
import { AlertRepository } from '../../src/modules/alerts/repositories/alert.repo';

describe('Alerts Integration', () => {
  it('creates overdue alerts', async () => {
    const loansRepo: Partial<LoanRepository> = {
      findOverdue: async () => [
        {
          id: 'loan-1',
          userId: 'user-1',
          copyId: 'copy-1',
          status: 'active',
          checkedOutAt: '',
          dueAt: ''
        }
      ],
      update: async () => ({
        id: 'loan-1',
        userId: 'user-1',
        copyId: 'copy-1',
        status: 'overdue',
        checkedOutAt: '',
        dueAt: ''
      })
    };

    const alertRepo: Partial<AlertRepository> = {
      findByLoanIds: async () => [],
      create: async () =>
        ({
          id: 'alert-1',
          userId: 'user-1',
          loanId: 'loan-1',
          type: 'overdue',
          status: 'sent',
          channel: 'in_app',
          sentAt: new Date().toISOString()
        }) as any
    };

    const app = await createTestApp(
      new Map([
        [LoanRepository, loansRepo],
        [AlertRepository, alertRepo]
      ])
    );

    const res = await request(app.getHttpServer()).post('/api/v1/alerts/overdue/run').expect(201);
    expect(res.body.processed).toBe(1);

    await closeTestApp(app);
  });
});

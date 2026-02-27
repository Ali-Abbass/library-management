import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { LoanRepository } from '../../src/modules/loans/repositories/loan.repo';

describe('Loans History Integration', () => {
  it('returns loan history records', async () => {
    const loansRepo: Partial<LoanRepository> = {
      findByUser: async (userId: string) => [
        {
          id: 'loan-1',
          userId,
          copyId: 'copy-1',
          status: 'returned',
          checkedOutAt: '',
          dueAt: ''
        }
      ]
    };

    const app = await createTestApp(new Map<unknown, unknown>([[LoanRepository, loansRepo]]));

    const res = await request(app.getHttpServer()).get('/api/v1/loans/history?userId=user-1').expect(200);
    expect(res.body[0]).toMatchObject({ id: 'loan-1', userId: 'user-1' });

    await closeTestApp(app);
  });
});

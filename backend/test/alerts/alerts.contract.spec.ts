import request from 'supertest';
import { createTestApp, closeTestApp } from '../test-utils';
import { AlertsService } from '../../src/modules/alerts/alerts.service';
import { OverdueService } from '../../src/modules/alerts/overdue.service';

describe('Alerts API Contracts', () => {
  it('supports alerts endpoints', async () => {
    const alertsService: Partial<AlertsService> = {
      listForUser: async () => [{ id: 'alert-1', loanId: 'loan-1', userId: 'test-user' } as any]
    };
    const overdueService: Partial<OverdueService> = {
      findOverdueLoans: async () => ['loan-1']
    };

    const app = await createTestApp(
      new Map([
        [AlertsService, alertsService],
        [OverdueService, overdueService]
      ])
    );

    const listRes = await request(app.getHttpServer()).get('/api/v1/alerts').expect(200);
    expect(listRes.body[0]).toMatchObject({ id: 'alert-1', loanId: 'loan-1' });

    const runRes = await request(app.getHttpServer()).post('/api/v1/alerts/overdue/run').expect(201);
    expect(runRes.body.processed).toBe(1);

    await closeTestApp(app);
  });
});

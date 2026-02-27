import { Injectable } from '@nestjs/common';
import { LoanRepository } from '../loans/repositories/loan.repo';
import { AlertRepository } from './repositories/alert.repo';

@Injectable()
export class OverdueService {
  constructor(
    private readonly loansRepo: LoanRepository,
    private readonly alertsRepo: AlertRepository
  ) {}

  async findOverdueLoans(): Promise<string[]> {
    const overdueLoans = await this.loansRepo.findOverdue(new Date().toISOString());
    if (!overdueLoans.length) return [];

    const existingAlerts = await this.alertsRepo.findByLoanIds(overdueLoans.map((loan) => loan.id));
    const alertedLoanIds = new Set(existingAlerts.map((alert) => alert.loanId));

    const toAlert = overdueLoans.filter((loan) => !alertedLoanIds.has(loan.id));
    for (const loan of toAlert) {
      await this.alertsRepo.create({
        userId: loan.userId,
        loanId: loan.id,
        type: 'overdue',
        status: 'sent',
        channel: 'in_app',
        sentAt: new Date().toISOString()
      });
      await this.loansRepo.update(loan.id, { status: 'overdue' });
    }

    return toAlert.map((loan) => loan.id);
  }
}

import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { OverdueService } from './overdue.service';
import { AlertRepository } from './repositories/alert.repo';
import { LoanRepository } from '../loans/repositories/loan.repo';

@Module({
  controllers: [AlertsController],
  providers: [AlertsService, OverdueService, AlertRepository, LoanRepository]
})
export class AlertsModule {}

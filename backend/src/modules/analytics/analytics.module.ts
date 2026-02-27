import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ActivityRepository } from './repositories/activity.repo';
import { LoanRepository } from '../loans/repositories/loan.repo';
import { CopyRepository } from '../copies/repositories/copy.repo';
import { BookRepository } from '../books/repositories/book.repo';
import { UserRepository } from '../users/repositories/user.repo';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ActivityRepository, LoanRepository, CopyRepository, BookRepository, UserRepository]
})
export class AnalyticsModule {}

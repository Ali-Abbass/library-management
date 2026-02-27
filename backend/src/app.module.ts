import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AiModule } from './modules/ai/ai.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { BooksModule } from './modules/books/books.module';
import { CopiesModule } from './modules/copies/copies.module';
import { LoansModule } from './modules/loans/loans.module';
import { UsersModule } from './modules/users/users.module';
import { AuthGuard } from './common/auth/auth.guard';
import { RbacGuard } from './common/auth/rbac.guard';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    BooksModule,
    CopiesModule,
    LoansModule,
    AlertsModule,
    AnalyticsModule,
    AiModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard
    }
  ]
})
export class AppModule {}

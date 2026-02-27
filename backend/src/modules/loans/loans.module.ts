import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { LoanRepository } from './repositories/loan.repo';
import { CheckoutRequestRepository } from './repositories/checkout-request.repo';
import { CopyRepository } from '../copies/repositories/copy.repo';
import { BookRepository } from '../books/repositories/book.repo';
import { UserRepository } from '../users/repositories/user.repo';

@Module({
  controllers: [LoansController],
  providers: [LoansService, LoanRepository, CheckoutRequestRepository, CopyRepository, BookRepository, UserRepository]
})
export class LoansModule {}

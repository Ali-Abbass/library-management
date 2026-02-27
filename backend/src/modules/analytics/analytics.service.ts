import { Injectable } from '@nestjs/common';
import { LoanRepository } from '../loans/repositories/loan.repo';
import { CopyRepository } from '../copies/repositories/copy.repo';
import { ActivityRepository } from './repositories/activity.repo';
import { BookRepository } from '../books/repositories/book.repo';
import { UserRepository } from '../users/repositories/user.repo';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly loansRepo: LoanRepository,
    private readonly copiesRepo: CopyRepository,
    private readonly activityRepo: ActivityRepository,
    private readonly booksRepo: BookRepository,
    private readonly usersRepo: UserRepository
  ) {}

  async overview(from?: string, to?: string) {
    const loans = await this.loansRepo.listByRange(from, to);
    const totalLoans = loans.length;

    const borrowerCounts = new Map<string, number>();
    loans.forEach((loan) => {
      borrowerCounts.set(loan.userId, (borrowerCounts.get(loan.userId) ?? 0) + 1);
    });

    const topBorrowersRaw = Array.from(borrowerCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const topBorrowers = await Promise.all(
      topBorrowersRaw.map(async (borrower) => {
        const user = await this.usersRepo.findById(borrower.userId);
        return {
          count: borrower.count,
          userName: user?.fullName,
          userEmail: user?.email
        };
      })
    );

    const copyIds = loans.map((loan) => loan.copyId);
    const bookCounts = new Map<string, number>();
    if (copyIds.length) {
      const copies = await Promise.all(copyIds.map((id) => this.copiesRepo.findById(id)));
      copies
        .filter((copy): copy is NonNullable<typeof copy> => !!copy)
        .forEach((copy) => {
          bookCounts.set(copy.bookId, (bookCounts.get(copy.bookId) ?? 0) + 1);
        });
    }

    const mostBorrowedBooks = await Promise.all(
      Array.from(bookCounts.entries()).map(async ([bookId, count]) => {
        const book = await this.booksRepo.findById(bookId);
        return { code: book?.code, title: book?.title, count };
      })
    );
    const mostBorrowedSorted = mostBorrowedBooks
      .map((entry) => ({ ...entry }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalLoans,
      topBorrowers,
      mostBorrowedBooks: mostBorrowedSorted
    };
  }

  async exportCsv(from?: string, to?: string) {
    const activity = await this.activityRepo.list(from, to);
    const rows = activity.map((entry) => `${entry.actorId ?? ''},${entry.action}`);
    return `user,action\n${rows.join('\n')}`;
  }
}

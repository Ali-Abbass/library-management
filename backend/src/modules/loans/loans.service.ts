import { ForbiddenException, Injectable } from '@nestjs/common';
import { CopyRepository } from '../copies/repositories/copy.repo';
import { BookRepository } from '../books/repositories/book.repo';
import { LoanEntity } from './entities/loan.entity';
import { LoanRepository } from './repositories/loan.repo';
import { CheckoutRequestRepository } from './repositories/checkout-request.repo';
import { Role } from '../auth/roles';
import { UserStatus } from '../users/user-status';
import { UserRepository } from '../users/repositories/user.repo';
import { logAuditEvent } from '../../common/logging/audit.logger';

const DEFAULT_LOAN_DAYS = 14;

type CheckoutRequest = {
  copyId: string;
  copyCode?: string;
  dueAt?: string;
  bookArchived?: boolean;
  userId?: string;
  actorId?: string;
};

@Injectable()
export class LoansService {
  constructor(
    private readonly loansRepo: LoanRepository,
    private readonly requestRepo: CheckoutRequestRepository,
    private readonly copiesRepo: CopyRepository,
    private readonly booksRepo: BookRepository,
    private readonly usersRepo: UserRepository
  ) {}

  async checkout(request: CheckoutRequest): Promise<LoanEntity> {
    if (request.bookArchived) {
      throw new Error('Book is archived');
    }
    const dueAt = request.dueAt || new Date(Date.now() + DEFAULT_LOAN_DAYS * 86400000).toISOString();
    const copy = await this.copiesRepo.findById(request.copyId);
    if (!copy) {
      throw new Error('Copy not found');
    }
    const book = await this.booksRepo.findById(copy.bookId);
    if (book?.status === 'archived') {
      throw new Error('Book is archived');
    }
    const updatedCopy = await this.copiesRepo.markCheckedOut(request.copyId);
    if (!updatedCopy) {
      throw new Error('Copy is no longer available');
    }
    let loan: LoanEntity;
    try {
      loan = await this.loansRepo.create({
        copyId: request.copyId,
        dueAt,
        status: 'active',
        checkedOutAt: new Date().toISOString(),
        checkedOutBy: request.actorId ?? request.userId,
        userId: request.userId ?? 'me'
      });
    } catch (error) {
      await this.copiesRepo.updateStatus(request.copyId, 'available');
      throw error;
    }
    await logAuditEvent({
      actorId: request.actorId ?? request.userId ?? 'unknown',
      action: 'loan.checkout',
      entityType: 'loan',
      entityId: loan.id
    });
    return loan;
  }

  async resolveCopyId(copyId?: string, copyCode?: string): Promise<string> {
    if (copyId) {
      return copyId;
    }
    if (copyCode) {
      const copy = await this.copiesRepo.findByBarcode(copyCode.trim().toUpperCase());
      if (!copy) {
        throw new Error('Copy not found');
      }
      return copy.id;
    }
    throw new Error('copyId or copyCode is required');
  }

  async checkoutToUser(input: {
    actorId: string;
    actorRoles: Role[];
    targetUserId: string;
    copyId?: string;
    copyCode?: string;
    dueAt?: string;
    requestId?: string;
  }): Promise<LoanEntity> {
    const isAdmin = input.actorRoles.includes(Role.Admin);
    const isStaffOnly = input.actorRoles.includes(Role.Staff) && !isAdmin;
    if (isStaffOnly && !input.requestId) {
      throw new ForbiddenException('Staff can only checkout books from existing requests');
    }

    const target = await this.usersRepo.findById(input.targetUserId);
    if (!target) {
      throw new Error('Target user not found');
    }
    if (target.status !== UserStatus.Active) {
      throw new Error('Target user is not active');
    }

    const copyId = await this.resolveCopyId(input.copyId, input.copyCode);
    await this.ensureCopyAvailable(copyId);

    if (input.requestId) {
      const request = await this.requestRepo.findById(input.requestId);
      if (!request || request.status !== 'pending') {
        throw new Error('Checkout request not found or already processed');
      }
      if (request.userId !== input.targetUserId) {
        throw new Error('Checkout request does not belong to selected patron');
      }
      const copy = await this.copiesRepo.findById(copyId);
      if (!copy || copy.bookId !== request.bookId) {
        throw new Error('Selected copy does not match requested book');
      }
    }

    const loan = await this.checkout({
      copyId,
      dueAt: input.dueAt,
      userId: input.targetUserId,
      actorId: input.actorId
    });

    if (input.requestId) {
      await this.requestRepo.updateStatus({
        id: input.requestId,
        status: 'fulfilled',
        processedBy: input.actorId,
        note: `Fulfilled with copy ${copyId}`
      });
    }

    return loan;
  }

  async returnLoan(loanId: string, requesterId: string, roles: Role[]): Promise<LoanEntity> {
    const loan = await this.loansRepo.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }
    const isPrivileged = roles.some((role) => role === Role.Admin || role === Role.Staff);
    if (!isPrivileged && loan.userId !== requesterId) {
      throw new ForbiddenException('Cannot return another user loan');
    }
    const updated = await this.loansRepo.update(loanId, {
      status: 'returned',
      returnedAt: new Date().toISOString()
    });
    await this.copiesRepo.updateStatus(loan.copyId, 'available');
    await logAuditEvent({
      actorId: requesterId,
      action: 'loan.return',
      entityType: 'loan',
      entityId: loan.id
    });
    return updated;
  }

  async listByUser(userId: string): Promise<LoanEntity[]> {
    if (!userId || userId === 'all') {
      return this.loansRepo.listAll();
    }
    return this.loansRepo.findByUser(userId);
  }

  async listByActor(actorId: string): Promise<LoanEntity[]> {
    return this.loansRepo.findByCheckedOutBy(actorId);
  }

  async ensureCopyAvailable(copyId: string): Promise<void> {
    const copy = await this.copiesRepo.findById(copyId);
    if (!copy) {
      throw new Error('Copy not found');
    }
    if (copy.status !== 'available') {
      throw new Error('Copy is not available');
    }
    const existing = await this.loansRepo.findActiveByCopy(copyId);
    if (existing) {
      throw new Error('Copy is already checked out');
    }
  }

  async findActiveByCopy(copyId: string): Promise<LoanEntity | null> {
    return this.loansRepo.findActiveByCopy(copyId);
  }

  async ensureBorrowingAllowed(status?: string) {
    if (status && status !== UserStatus.Active) {
      throw new ForbiddenException('Account pending approval');
    }
  }

  async createCheckoutRequest(input: { userId: string; bookId: string; note?: string }) {
    const book = await this.booksRepo.findById(input.bookId);
    if (!book) {
      throw new Error('Book not found');
    }
    const existing = await this.requestRepo.findPendingByUserAndBook(input.userId, input.bookId);
    if (existing) {
      return existing;
    }
    const request = await this.requestRepo.create({
      userId: input.userId,
      bookId: input.bookId,
      status: 'pending',
      note: input.note
    });
    await logAuditEvent({
      actorId: input.userId,
      action: 'loan.request.create',
      entityType: 'loan_request',
      entityId: request.id
    });
    return request;
  }

  async listCheckoutRequests(status?: 'pending' | 'fulfilled' | 'rejected') {
    const requests = await this.requestRepo.list(status);
    const enriched = await Promise.all(
      requests.map(async (request) => {
        const [user, book] = await Promise.all([
          this.usersRepo.findById(request.userId),
          this.booksRepo.findById(request.bookId)
        ]);
        return {
          ...request,
          userEmail: user?.email,
          userName: user?.fullName,
          bookTitle: book?.title,
          bookCode: book?.code
        };
      })
    );
    return enriched;
  }

  async rejectCheckoutRequest(input: { requestId: string; actorId: string; note?: string }) {
    const request = await this.requestRepo.findById(input.requestId);
    if (!request || request.status !== 'pending') {
      throw new Error('Checkout request not found or already processed');
    }
    const updated = await this.requestRepo.updateStatus({
      id: input.requestId,
      status: 'rejected',
      processedBy: input.actorId,
      note: input.note
    });
    await logAuditEvent({
      actorId: input.actorId,
      action: 'loan.request.reject',
      entityType: 'loan_request',
      entityId: updated.id
    });
    return updated;
  }
}

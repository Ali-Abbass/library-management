import { Body, Controller, Get, Param, Post, Query, Req, ForbiddenException } from '@nestjs/common';
import { LoansService } from './loans.service';
import { RequireRoles } from '../../common/auth/rbac.guard';
import { Role } from '../auth/roles';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post('checkout')
  @RequireRoles(Role.Admin)
  async checkout(
    @Req() req: { user?: { id: string; status?: string } },
    @Body() body: { copyId?: string; copyCode?: string; dueAt?: string }
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }
    await this.loansService.ensureBorrowingAllowed(req.user?.status);
    const copyId = await this.loansService.resolveCopyId(body.copyId, body.copyCode);
    await this.loansService.ensureCopyAvailable(copyId);
    return this.loansService.checkout({ ...body, copyId, userId, actorId: userId });
  }

  @Post('checkout-to-user')
  @RequireRoles(Role.Admin, Role.Staff)
  async checkoutToUser(
    @Req() req: { user?: { id: string; roles?: Role[] } },
    @Body() body: { userId: string; copyId?: string; copyCode?: string; dueAt?: string; requestId?: string }
  ) {
    const actorId = req.user?.id;
    if (!actorId) {
      throw new ForbiddenException('User not authenticated');
    }
    return this.loansService.checkoutToUser({
      actorId,
      actorRoles: req.user?.roles ?? [],
      targetUserId: body.userId,
      copyId: body.copyId,
      copyCode: body.copyCode,
      dueAt: body.dueAt,
      requestId: body.requestId
    });
  }

  @Post('requests')
  @RequireRoles(Role.Patron)
  async createRequest(
    @Req() req: { user?: { id: string; status?: string } },
    @Body() body: { bookId: string; note?: string }
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }
    await this.loansService.ensureBorrowingAllowed(req.user?.status);
    return this.loansService.createCheckoutRequest({ userId, bookId: body.bookId, note: body.note });
  }

  @Get('requests')
  @RequireRoles(Role.Admin, Role.Staff)
  listRequests(@Query('status') status?: 'pending' | 'fulfilled' | 'rejected') {
    return this.loansService.listCheckoutRequests(status);
  }

  @Post('requests/:requestId/reject')
  @RequireRoles(Role.Admin, Role.Staff)
  async rejectRequest(
    @Req() req: { user?: { id: string } },
    @Param('requestId') requestId: string,
    @Body() body: { note?: string }
  ) {
    const actorId = req.user?.id;
    if (!actorId) {
      throw new ForbiddenException('User not authenticated');
    }
    return this.loansService.rejectCheckoutRequest({ requestId, actorId, note: body.note });
  }

  @Post('return')
  @RequireRoles(Role.Admin, Role.Staff)
  async returnLoan(
    @Req() req: { user?: { id: string; roles?: Role[] } },
    @Body() body: { loanId?: string; copyId?: string }
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }
    if (body.loanId) {
      return this.loansService.returnLoan(body.loanId, userId, req.user?.roles ?? []);
    }
    if (body.copyId) {
      const active = await this.loansService.findActiveByCopy(body.copyId);
      if (!active) {
        throw new Error('Active loan not found');
      }
      return this.loansService.returnLoan(active.id, userId, req.user?.roles ?? []);
    }
    throw new Error('loanId or copyId is required');
  }

  @Get()
  async list(
    @Req() req: { user?: { id: string; roles?: Role[] } },
    @Query('userId') userId?: string
  ) {
    const requesterId = req.user?.id;
    if (!requesterId) {
      throw new ForbiddenException('User not authenticated');
    }
    const roles = req.user?.roles ?? [];
    const isAdmin = roles.includes(Role.Admin);
    const isStaff = roles.includes(Role.Staff) && !isAdmin;
    if (userId && userId !== requesterId && !isAdmin) {
      throw new ForbiddenException('Insufficient permissions');
    }
    if (isAdmin) {
      return this.loansService.listByUser(userId ?? 'all');
    }
    if (isStaff) {
      if (userId && userId !== requesterId) {
        throw new ForbiddenException('Staff can only access their own processed loans');
      }
      return this.loansService.listByActor(requesterId);
    }
    return this.loansService.listByUser(requesterId);
  }

  @Get('history')
  @RequireRoles(Role.Admin, Role.Staff)
  async history(@Query('userId') userId?: string) {
    return this.loansService.listByUser(userId ?? 'all');
  }
}

import { Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { OverdueService } from './overdue.service';
import { RequireRoles } from '../../common/auth/rbac.guard';
import { Role } from '../auth/roles';

@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly overdueService: OverdueService
  ) {}

  @Post('overdue/run')
  @RequireRoles(Role.Admin, Role.Staff)
  async runOverdue() {
    const overdue = await this.overdueService.findOverdueLoans();
    return { processed: overdue.length };
  }

  @Get()
  async list(
    @Req() req: { user?: { id: string; roles?: Role[] } },
    @Query('userId') userId?: string
  ) {
    const requesterId = req.user?.id ?? 'me';
    const isPrivileged = (req.user?.roles ?? []).some((role) => role === Role.Admin || role === Role.Staff);
    const targetUser = userId && isPrivileged ? userId : requesterId;
    return this.alertsService.listForUser(targetUser);
  }
}

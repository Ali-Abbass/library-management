import { Controller, Get, Header, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RequireRoles } from '../../common/auth/rbac.guard';
import { Role } from '../auth/roles';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @RequireRoles(Role.Admin, Role.Staff)
  overview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.overview(from, to);
  }

  @Get('export')
  @RequireRoles(Role.Admin, Role.Staff)
  @Header('Content-Type', 'text/csv')
  export(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.exportCsv(from, to);
  }
}

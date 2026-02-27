import { Body, Controller, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { RequireRoles } from '../../common/auth/rbac.guard';
import { Role } from '../auth/roles';

@Controller('admin/approvals')
export class ApprovalsController {
  constructor(private readonly usersService: UsersService) {}

  @Patch()
  @RequireRoles(Role.Admin)
  approvePatron(@Body() body: { userId: string }) {
    return this.usersService.approvePatron(body.userId);
  }
}

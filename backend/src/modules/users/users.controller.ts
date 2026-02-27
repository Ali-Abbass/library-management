import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { RequireRoles } from '../../common/auth/rbac.guard';
import { Role } from '../auth/roles';

@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequireRoles(Role.Admin, Role.Staff)
  list(@Query('status') status?: string, @Query('q') query?: string) {
    return this.usersService.list(status, query);
  }

  @Patch('roles')
  @RequireRoles(Role.Admin)
  updateRoles(@Body() body: { userId: string; roles: string[] }) {
    return this.usersService.updateRoles(body.userId, body.roles);
  }
}

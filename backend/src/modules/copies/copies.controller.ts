import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CopiesService } from './copies.service';
import { RequireRoles } from '../../common/auth/rbac.guard';
import { Role } from '../auth/roles';

@Controller('books/:id/copies')
export class CopiesController {
  constructor(private readonly copiesService: CopiesService) {}

  @Get()
  list(@Param('id') bookId: string) {
    return this.copiesService.listByBook(bookId);
  }

  @Post()
  @RequireRoles(Role.Admin, Role.Staff)
  create(@Param('id') bookId: string, @Body() body: Record<string, unknown>) {
    return this.copiesService.create(bookId, body);
  }

  @Patch(':copyId')
  @RequireRoles(Role.Admin, Role.Staff)
  update(@Param('copyId') copyId: string, @Body() body: Record<string, unknown>) {
    return this.copiesService.update(copyId, body);
  }

  @Delete(':copyId')
  @RequireRoles(Role.Admin, Role.Staff)
  remove(@Param('copyId') copyId: string) {
    return this.copiesService.remove(copyId);
  }
}

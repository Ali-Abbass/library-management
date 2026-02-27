import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BooksService } from './books.service';
import { CopiesService } from '../copies/copies.service';
import { RequireRoles } from '../../common/auth/rbac.guard';
import { Role } from '../auth/roles';

@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly copiesService: CopiesService
  ) {}

  @Get()
  search(@Query() query: Record<string, string | string[]>) {
    return this.booksService.search(query);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const book = await this.booksService.getById(id);
    const availability = await this.copiesService.availabilityByBook(id);
    return { book, availability };
  }

  @Post()
  @RequireRoles(Role.Admin, Role.Staff)
  create(@Body() body: Record<string, unknown>) {
    return this.booksService.create(body);
  }

  @Patch(':id')
  @RequireRoles(Role.Admin, Role.Staff)
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.booksService.update(id, body);
  }

  @Post(':id/archive')
  @RequireRoles(Role.Admin)
  archive(@Param('id') id: string) {
    return this.booksService.setStatus(id, 'archived');
  }

  @Post(':id/restore')
  @RequireRoles(Role.Admin)
  restore(@Param('id') id: string) {
    return this.booksService.setStatus(id, 'active');
  }

  @Delete(':id')
  @RequireRoles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}

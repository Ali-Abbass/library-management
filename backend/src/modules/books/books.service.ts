import { Injectable } from '@nestjs/common';
import { BookEntity, BookStatus } from './entities/book.entity';
import { CopiesService } from '../copies/copies.service';
import { BookRepository } from './repositories/book.repo';
import { logAuditEvent } from '../../common/logging/audit.logger';

@Injectable()
export class BooksService {
  constructor(
    private readonly repo: BookRepository,
    private readonly copiesService: CopiesService
  ) {}

  async search(query: Record<string, string | string[]>) {
    const books = await this.repo.search(query);
    const availability = await Promise.all(
      books.map((book) => this.copiesService.availabilityByBook(book.id))
    );
    return books.map((book, index) => ({
      ...book,
      availability: availability[index]
    }));
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }

  async create(input: Partial<BookEntity>) {
    const created = await this.repo.create(input);
    await logAuditEvent({
      actorId: 'system',
      action: 'book.create',
      entityType: 'book',
      entityId: created.id
    });
    return created;
  }

  async update(id: string, input: Partial<BookEntity>) {
    const updated = await this.repo.update(id, input);
    await logAuditEvent({
      actorId: 'system',
      action: 'book.update',
      entityType: 'book',
      entityId: id
    });
    return updated;
  }

  async setStatus(id: string, status: BookStatus) {
    const updated = await this.repo.updateStatus(id, status);
    await logAuditEvent({
      actorId: 'system',
      action: status === 'archived' ? 'book.archive' : 'book.restore',
      entityType: 'book',
      entityId: id
    });
    return updated;
  }

  async remove(id: string) {
    await this.repo.remove(id);
    await logAuditEvent({
      actorId: 'system',
      action: 'book.remove',
      entityType: 'book',
      entityId: id
    });
    return { id };
  }
}

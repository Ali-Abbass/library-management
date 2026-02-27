import { Injectable } from '@nestjs/common';
import { CopyEntity, CopyStatus } from './entities/copy.entity';
import { CopyRepository } from './repositories/copy.repo';
import { logAuditEvent } from '../../common/logging/audit.logger';

@Injectable()
export class CopiesService {
  constructor(private readonly repo: CopyRepository) {}

  private createCopyCode(): string {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `CPY-${random}`;
  }

  private async resolveUniqueCopyCode(preferred?: string): Promise<string> {
    const normalize = (value: string) => value.trim().toUpperCase();
    const firstCandidate = preferred ? normalize(preferred) : this.createCopyCode();
    let candidate = firstCandidate;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const existing = await this.repo.findByBarcode(candidate);
      if (!existing) {
        return candidate;
      }
      candidate = this.createCopyCode();
    }

    throw new Error('Unable to allocate unique copy code');
  }

  async listByBook(bookId: string) {
    return this.repo.findByBookId(bookId);
  }

  async findById(copyId: string) {
    return this.repo.findById(copyId);
  }

  async findByCode(copyCode: string) {
    if (!copyCode.trim()) {
      return null;
    }
    return this.repo.findByBarcode(copyCode.trim().toUpperCase());
  }

  async create(bookId: string, input: Partial<CopyEntity>) {
    const barcode = await this.resolveUniqueCopyCode(input.barcode);
    const created = await this.repo.create({ ...input, barcode, bookId });
    await logAuditEvent({
      actorId: 'system',
      action: 'copy.create',
      entityType: 'copy',
      entityId: created.id
    });
    return created;
  }

  async update(copyId: string, input: Partial<CopyEntity>) {
    const payload = { ...input };
    if (payload.barcode !== undefined) {
      const current = await this.repo.findById(copyId);
      if (!current) {
        throw new Error('Copy not found');
      }
      const nextBarcode = payload.barcode.trim().toUpperCase();
      if (!nextBarcode) {
        throw new Error('Copy code cannot be empty');
      }
      if (current.barcode !== nextBarcode) {
        const existing = await this.repo.findByBarcode(nextBarcode);
        if (existing && existing.id !== copyId) {
          throw new Error('Copy code already in use');
        }
      }
      payload.barcode = nextBarcode;
    }

    const updated = await this.repo.update(copyId, payload);
    await logAuditEvent({
      actorId: 'system',
      action: 'copy.update',
      entityType: 'copy',
      entityId: copyId
    });
    return updated;
  }

  async updateStatus(copyId: string, status: CopyStatus) {
    return this.repo.updateStatus(copyId, status);
  }

  async remove(copyId: string) {
    await this.repo.remove(copyId);
    await logAuditEvent({
      actorId: 'system',
      action: 'copy.remove',
      entityType: 'copy',
      entityId: copyId
    });
    return { id: copyId };
  }

  async availabilityByBook(bookId: string) {
    const copies = await this.listByBook(bookId);
    const summary = copies.reduce(
      (acc, copy) => {
        acc.total += 1;
        if (copy.status === 'available') acc.available += 1;
        if (copy.status === 'checked_out') acc.checkedOut += 1;
        if (copy.status === 'archived') acc.archived += 1;
        return acc;
      },
      { total: 0, available: 0, checkedOut: 0, archived: 0 }
    );
    return summary;
  }
}

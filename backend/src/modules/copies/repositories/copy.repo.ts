import { Injectable } from '@nestjs/common';
import { supabaseDelete, supabaseInsert, supabaseSelect, supabaseSelectOne, supabaseUpdate } from '../../../common/supabase/supabase.client';
import { CopyEntity, CopyStatus } from '../entities/copy.entity';

type CopyRow = {
  id: string;
  book_id: string;
  barcode: string | null;
  location: string | null;
  status: CopyStatus;
  condition: string | null;
  created_at: string;
};

function mapCopyRow(row: CopyRow): CopyEntity {
  return {
    id: row.id,
    bookId: row.book_id,
    barcode: row.barcode ?? undefined,
    location: row.location ?? undefined,
    status: row.status,
    condition: row.condition ?? undefined,
    createdAt: row.created_at
  };
}

function mapCopyUpdate(input: Partial<CopyEntity>): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  if (input.bookId !== undefined) update.book_id = input.bookId;
  if (input.barcode !== undefined) update.barcode = input.barcode;
  if (input.location !== undefined) update.location = input.location;
  if (input.status !== undefined) update.status = input.status;
  if (input.condition !== undefined) update.condition = input.condition;
  return update;
}

@Injectable()
export class CopyRepository {
  async findByBookId(_bookId: string): Promise<CopyEntity[]> {
    const rows = await supabaseSelect<CopyRow>('copies', {
      filters: [{ column: 'book_id', operator: 'eq', value: _bookId }],
      order: 'created_at.asc'
    });
    return rows.map(mapCopyRow);
  }

  async findById(id: string): Promise<CopyEntity | null> {
    const row = await supabaseSelectOne<CopyRow>('copies', {
      filters: [{ column: 'id', operator: 'eq', value: id }],
      limit: 1
    });
    return row ? mapCopyRow(row) : null;
  }

  async findByBarcode(barcode: string): Promise<CopyEntity | null> {
    const row = await supabaseSelectOne<CopyRow>('copies', {
      filters: [{ column: 'barcode', operator: 'eq', value: barcode }],
      limit: 1
    });
    return row ? mapCopyRow(row) : null;
  }

  async create(input: Partial<CopyEntity>): Promise<CopyEntity> {
    const payload = mapCopyUpdate(input);
    const row = await supabaseInsert<CopyRow>('copies', payload, { single: true });
    if (!row) {
      throw new Error('Failed to create copy');
    }
    return mapCopyRow(row as CopyRow);
  }

  async update(id: string, input: Partial<CopyEntity>): Promise<CopyEntity> {
    const payload = mapCopyUpdate(input);
    const row = await supabaseUpdate<CopyRow>('copies', payload, {
      filters: [{ column: 'id', operator: 'eq', value: id }],
      limit: 1
    }, { single: true });
    if (!row) {
      throw new Error('Failed to update copy');
    }
    return mapCopyRow(row as CopyRow);
  }

  async updateStatus(id: string, status: CopyStatus): Promise<CopyEntity> {
    return this.update(id, { status });
  }

  async remove(id: string): Promise<void> {
    await supabaseDelete('copies', {
      filters: [{ column: 'id', operator: 'eq', value: id }],
      limit: 1
    });
  }

  async markCheckedOut(id: string): Promise<CopyEntity | null> {
    const row = await supabaseUpdate<CopyRow>('copies', { status: 'checked_out' }, {
      filters: [
        { column: 'id', operator: 'eq', value: id },
        { column: 'status', operator: 'eq', value: 'available' }
      ],
      limit: 1
    }, { single: true });
    return row ? mapCopyRow(row as CopyRow) : null;
  }
}

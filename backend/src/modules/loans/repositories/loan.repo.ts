import { Injectable } from '@nestjs/common';
import { supabaseInsert, supabaseSelect, supabaseSelectOne, supabaseUpdate } from '../../../common/supabase/supabase.client';
import { LoanEntity, LoanStatus } from '../entities/loan.entity';

type LoanRow = {
  id: string;
  user_id: string;
  checked_out_by: string | null;
  copy_id: string;
  status: LoanStatus;
  checked_out_at: string;
  due_at: string;
  returned_at: string | null;
};

function mapLoanRow(row: LoanRow): LoanEntity {
  return {
    id: row.id,
    userId: row.user_id,
    checkedOutBy: row.checked_out_by ?? undefined,
    copyId: row.copy_id,
    status: row.status,
    checkedOutAt: row.checked_out_at,
    dueAt: row.due_at,
    returnedAt: row.returned_at ?? undefined
  };
}

function mapLoanUpdate(input: Partial<LoanEntity>): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  if (input.userId !== undefined) update.user_id = input.userId;
  if (input.checkedOutBy !== undefined) update.checked_out_by = input.checkedOutBy;
  if (input.copyId !== undefined) update.copy_id = input.copyId;
  if (input.status !== undefined) update.status = input.status;
  if (input.checkedOutAt !== undefined) update.checked_out_at = input.checkedOutAt;
  if (input.dueAt !== undefined) update.due_at = input.dueAt;
  if (input.returnedAt !== undefined) update.returned_at = input.returnedAt;
  return update;
}

@Injectable()
export class LoanRepository {
  async findByUser(_userId: string): Promise<LoanEntity[]> {
    const rows = await supabaseSelect<LoanRow>('loans', {
      filters: [{ column: 'user_id', operator: 'eq', value: _userId }],
      order: 'checked_out_at.desc'
    });
    return rows.map(mapLoanRow);
  }

  async listAll(): Promise<LoanEntity[]> {
    const rows = await supabaseSelect<LoanRow>('loans', {
      order: 'checked_out_at.desc'
    });
    return rows.map(mapLoanRow);
  }

  async findByCheckedOutBy(actorId: string): Promise<LoanEntity[]> {
    const rows = await supabaseSelect<LoanRow>('loans', {
      filters: [{ column: 'checked_out_by', operator: 'eq', value: actorId }],
      order: 'checked_out_at.desc'
    });
    return rows.map(mapLoanRow);
  }

  async listByRange(from?: string, to?: string): Promise<LoanEntity[]> {
    const filters = [];
    if (from) filters.push({ column: 'checked_out_at', operator: 'gte', value: from });
    if (to) filters.push({ column: 'checked_out_at', operator: 'lte', value: to });
    const rows = await supabaseSelect<LoanRow>('loans', {
      filters,
      order: 'checked_out_at.desc'
    });
    return rows.map(mapLoanRow);
  }

  async findById(id: string): Promise<LoanEntity | null> {
    const row = await supabaseSelectOne<LoanRow>('loans', {
      filters: [{ column: 'id', operator: 'eq', value: id }],
      limit: 1
    });
    return row ? mapLoanRow(row) : null;
  }

  async findActiveByCopy(copyId: string): Promise<LoanEntity | null> {
    const row = await supabaseSelectOne<LoanRow>('loans', {
      filters: [
        { column: 'copy_id', operator: 'eq', value: copyId },
        { column: 'status', operator: 'in', value: '(active,overdue)' }
      ],
      limit: 1
    });
    return row ? mapLoanRow(row) : null;
  }

  async findOverdue(cutoffIso: string): Promise<LoanEntity[]> {
    const rows = await supabaseSelect<LoanRow>('loans', {
      filters: [
        { column: 'status', operator: 'eq', value: 'active' },
        { column: 'due_at', operator: 'lt', value: cutoffIso }
      ],
      order: 'due_at.asc'
    });
    return rows.map(mapLoanRow);
  }

  async create(input: Partial<LoanEntity>): Promise<LoanEntity> {
    const payload = mapLoanUpdate(input);
    const row = await supabaseInsert<LoanRow>('loans', payload, { single: true });
    if (!row) {
      throw new Error('Failed to create loan');
    }
    return mapLoanRow(row as LoanRow);
  }

  async update(id: string, input: Partial<LoanEntity>): Promise<LoanEntity> {
    const payload = mapLoanUpdate(input);
    const row = await supabaseUpdate<LoanRow>('loans', payload, {
      filters: [{ column: 'id', operator: 'eq', value: id }],
      limit: 1
    }, { single: true });
    if (!row) {
      throw new Error('Failed to update loan');
    }
    return mapLoanRow(row as LoanRow);
  }
}

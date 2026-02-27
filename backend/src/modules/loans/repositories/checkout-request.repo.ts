import { Injectable } from '@nestjs/common';
import { supabaseInsert, supabaseSelect, supabaseSelectOne, supabaseUpdate } from '../../../common/supabase/supabase.client';
import { CheckoutRequestEntity, CheckoutRequestStatus } from '../entities/checkout-request.entity';

type CheckoutRequestRow = {
  id: string;
  user_id: string;
  book_id: string;
  status: CheckoutRequestStatus;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  note: string | null;
};

function mapRow(row: CheckoutRequestRow): CheckoutRequestEntity {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    status: row.status,
    requestedAt: row.requested_at,
    processedAt: row.processed_at ?? undefined,
    processedBy: row.processed_by ?? undefined,
    note: row.note ?? undefined
  };
}

@Injectable()
export class CheckoutRequestRepository {
  async create(input: {
    userId: string;
    bookId: string;
    status?: CheckoutRequestStatus;
    note?: string;
  }): Promise<CheckoutRequestEntity> {
    const row = await supabaseInsert<CheckoutRequestRow>(
      'loan_requests',
      {
        user_id: input.userId,
        book_id: input.bookId,
        status: input.status ?? 'pending',
        note: input.note
      },
      { single: true }
    );
    return mapRow(row as CheckoutRequestRow);
  }

  async findById(id: string): Promise<CheckoutRequestEntity | null> {
    const row = await supabaseSelectOne<CheckoutRequestRow>('loan_requests', {
      filters: [{ column: 'id', operator: 'eq', value: id }],
      limit: 1
    });
    return row ? mapRow(row) : null;
  }

  async list(status?: CheckoutRequestStatus): Promise<CheckoutRequestEntity[]> {
    const filters = [];
    if (status) {
      filters.push({ column: 'status', operator: 'eq', value: status });
    }
    const rows = await supabaseSelect<CheckoutRequestRow>('loan_requests', {
      filters,
      order: 'requested_at.desc'
    });
    return rows.map(mapRow);
  }

  async findPendingByUserAndBook(userId: string, bookId: string): Promise<CheckoutRequestEntity | null> {
    const row = await supabaseSelectOne<CheckoutRequestRow>('loan_requests', {
      filters: [
        { column: 'user_id', operator: 'eq', value: userId },
        { column: 'book_id', operator: 'eq', value: bookId },
        { column: 'status', operator: 'eq', value: 'pending' }
      ],
      limit: 1
    });
    return row ? mapRow(row) : null;
  }

  async updateStatus(input: {
    id: string;
    status: CheckoutRequestStatus;
    processedBy: string;
    note?: string;
  }): Promise<CheckoutRequestEntity> {
    const row = await supabaseUpdate<CheckoutRequestRow>(
      'loan_requests',
      {
        status: input.status,
        processed_by: input.processedBy,
        processed_at: new Date().toISOString(),
        note: input.note
      },
      {
        filters: [{ column: 'id', operator: 'eq', value: input.id }],
        limit: 1
      },
      { single: true }
    );
    return mapRow(row as CheckoutRequestRow);
  }
}

import { Injectable } from '@nestjs/common';
import { supabaseInsert, supabaseSelect } from '../../../common/supabase/supabase.client';
import { AlertEntity, AlertStatus } from '../entities/alert.entity';

type AlertRow = {
  id: string;
  user_id: string;
  loan_id: string;
  type: 'overdue';
  status: AlertStatus;
  channel: 'in_app';
  sent_at: string;
};

function mapAlertRow(row: AlertRow): AlertEntity {
  return {
    id: row.id,
    userId: row.user_id,
    loanId: row.loan_id,
    type: row.type,
    status: row.status,
    channel: row.channel,
    sentAt: row.sent_at
  };
}

function mapAlertInsert(input: Partial<AlertEntity>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (input.userId !== undefined) payload.user_id = input.userId;
  if (input.loanId !== undefined) payload.loan_id = input.loanId;
  if (input.type !== undefined) payload.type = input.type;
  if (input.status !== undefined) payload.status = input.status;
  if (input.channel !== undefined) payload.channel = input.channel;
  if (input.sentAt !== undefined) payload.sent_at = input.sentAt;
  return payload;
}

@Injectable()
export class AlertRepository {
  async findByUser(_userId: string): Promise<AlertEntity[]> {
    const rows = await supabaseSelect<AlertRow>('alerts', {
      filters: [{ column: 'user_id', operator: 'eq', value: _userId }],
      order: 'sent_at.desc'
    });
    return rows.map(mapAlertRow);
  }

  async findByLoanIds(loanIds: string[]): Promise<AlertEntity[]> {
    if (!loanIds.length) return [];
    const rows = await supabaseSelect<AlertRow>('alerts', {
      filters: [{ column: 'loan_id', operator: 'in', value: `(${loanIds.join(',')})` }]
    });
    return rows.map(mapAlertRow);
  }

  async create(input: Partial<AlertEntity>): Promise<AlertEntity> {
    const payload = mapAlertInsert(input);
    const row = await supabaseInsert<AlertRow>('alerts', payload, { single: true });
    if (!row) {
      throw new Error('Failed to create alert');
    }
    return mapAlertRow(row as AlertRow);
  }
}

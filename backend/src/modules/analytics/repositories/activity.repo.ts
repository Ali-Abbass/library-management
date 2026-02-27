import { Injectable } from '@nestjs/common';
import { supabaseSelect } from '../../../common/supabase/supabase.client';
import { ActivityRecordEntity } from '../entities/activity.entity';

type ActivityRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
};

function mapActivityRow(row: ActivityRow): ActivityRecordEntity {
  return {
    id: row.id,
    actorId: row.actor_id ?? '',
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? '',
    occurredAt: row.occurred_at,
    metadata: (row.metadata ?? undefined) as Record<string, string> | undefined
  };
}

@Injectable()
export class ActivityRepository {
  async list(from?: string, to?: string): Promise<ActivityRecordEntity[]> {
    const filters = [];
    if (from) {
      filters.push({ column: 'occurred_at', operator: 'gte', value: from });
    }
    if (to) {
      filters.push({ column: 'occurred_at', operator: 'lte', value: to });
    }
    const rows = await supabaseSelect<ActivityRow>('activity', {
      filters,
      order: 'occurred_at.desc'
    });
    return rows.map(mapActivityRow);
  }
}

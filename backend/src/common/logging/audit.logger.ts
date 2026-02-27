type AuditEvent = {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, string>;
};

import { supabaseInsert } from '../supabase/supabase.client';

export async function logAuditEvent(event: AuditEvent) {
  try {
    await supabaseInsert('activity', {
      actor_id: event.actorId,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId,
      metadata: event.metadata ?? null
    });
  } catch (error) {
    void error;
  }
}

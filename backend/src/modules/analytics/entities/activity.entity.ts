export class ActivityRecordEntity {
  id!: string;
  actorId!: string;
  action!: string;
  entityType!: string;
  entityId!: string;
  occurredAt!: string;
  metadata?: Record<string, string>;
}

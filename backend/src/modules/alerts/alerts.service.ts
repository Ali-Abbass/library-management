import { Injectable } from '@nestjs/common';
import { AlertEntity } from './entities/alert.entity';
import { AlertRepository } from './repositories/alert.repo';
import { logAuditEvent } from '../../common/logging/audit.logger';

@Injectable()
export class AlertsService {
  constructor(private readonly alertsRepo: AlertRepository) {}

  async createOverdueAlert(userId: string, loanId: string): Promise<AlertEntity> {
    const alert = await this.alertsRepo.create({
      userId,
      loanId,
      type: 'overdue',
      status: 'sent',
      channel: 'in_app',
      sentAt: new Date().toISOString()
    });
    await logAuditEvent({
      actorId: userId,
      action: 'alert.overdue',
      entityType: 'alert',
      entityId: alert.id
    });
    return alert;
  }

  async listForUser(userId: string): Promise<AlertEntity[]> {
    return this.alertsRepo.findByUser(userId);
  }
}

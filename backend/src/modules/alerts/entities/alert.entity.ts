export type AlertStatus = 'sent' | 'failed';

export class AlertEntity {
  id!: string;
  userId!: string;
  loanId!: string;
  type!: 'overdue';
  status!: AlertStatus;
  channel!: 'in_app';
  sentAt!: string;
}

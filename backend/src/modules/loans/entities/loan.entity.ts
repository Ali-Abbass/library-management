export type LoanStatus = 'active' | 'returned' | 'overdue';

export class LoanEntity {
  id!: string;
  userId!: string;
  checkedOutBy?: string;
  copyId!: string;
  status!: LoanStatus;
  checkedOutAt!: string;
  dueAt!: string;
  returnedAt?: string;
}

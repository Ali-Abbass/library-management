export type CheckoutRequestStatus = 'pending' | 'fulfilled' | 'rejected';

export class CheckoutRequestEntity {
  id!: string;
  userId!: string;
  bookId!: string;
  status!: CheckoutRequestStatus;
  requestedAt!: string;
  processedAt?: string;
  processedBy?: string;
  note?: string;
}

export type CopyStatus = 'available' | 'checked_out' | 'reserved' | 'archived' | 'lost';

export class CopyEntity {
  id!: string;
  bookId!: string;
  barcode?: string;
  location?: string;
  status!: CopyStatus;
  condition?: string;
  createdAt!: string;
}

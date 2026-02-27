export type BookStatus = 'active' | 'archived';

export class BookEntity {
  id!: string;
  code!: string;
  title!: string;
  subtitle?: string;
  authors!: string[];
  description?: string;
  tags?: string[];
  genres?: string[];
  language?: string;
  identifiers?: string[];
  publicationDate?: string;
  pageCount?: number;
  coverImageUrl?: string;
  metadata?: Record<string, string>;
  status!: BookStatus;
}

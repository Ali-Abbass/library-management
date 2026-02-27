import { Injectable } from '@nestjs/common';
import { supabaseDelete, supabaseInsert, supabaseSelect, supabaseSelectOne, supabaseUpdate, SupabaseQuery } from '../../../common/supabase/supabase.client';
import { BookEntity, BookStatus } from '../entities/book.entity';

type BookRow = {
  id: string;
  code: string;
  title: string;
  subtitle: string | null;
  authors: string[] | null;
  description: string | null;
  tags: string[] | null;
  genres: string[] | null;
  language: string | null;
  identifiers: string[] | null;
  publication_date: string | null;
  page_count: number | null;
  cover_image_url: string | null;
  metadata: Record<string, string> | null;
  status: BookStatus;
};

function mapBookRow(row: BookRow): BookEntity {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    authors: row.authors ?? [],
    description: row.description ?? undefined,
    tags: row.tags ?? undefined,
    genres: row.genres ?? undefined,
    language: row.language ?? undefined,
    identifiers: row.identifiers ?? undefined,
    publicationDate: row.publication_date ?? undefined,
    pageCount: row.page_count ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    metadata: row.metadata ?? undefined,
    status: row.status
  };
}

function mapBookUpdate(input: Partial<BookEntity>): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.subtitle !== undefined) update.subtitle = input.subtitle;
  if (input.authors !== undefined) update.authors = input.authors;
  if (input.description !== undefined) update.description = input.description;
  if (input.tags !== undefined) update.tags = input.tags;
  if (input.genres !== undefined) update.genres = input.genres;
  if (input.language !== undefined) update.language = input.language;
  if (input.identifiers !== undefined) update.identifiers = input.identifiers;
  if (input.publicationDate !== undefined) update.publication_date = input.publicationDate;
  if (input.pageCount !== undefined) update.page_count = input.pageCount;
  if (input.coverImageUrl !== undefined) update.cover_image_url = input.coverImageUrl;
  if (input.metadata !== undefined) update.metadata = input.metadata;
  if (input.status !== undefined) update.status = input.status;
  return update;
}

function asArray(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toArrayLiteral(values: string[]): string {
  const escaped = values.map((value) => {
    if (/[,\s{}"]/g.test(value)) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  });
  return `{${escaped.join(',')}}`;
}

@Injectable()
export class BookRepository {
  async findById(_id: string): Promise<BookEntity | null> {
    const row = await supabaseSelectOne<BookRow>('books', {
      filters: [{ column: 'id', operator: 'eq', value: _id }],
      limit: 1
    });
    return row ? mapBookRow(row) : null;
  }

  async search(_query: Record<string, string | string[]>): Promise<BookEntity[]> {
    const parsedPage = Number(_query.page ?? 1);
    const parsedPageSize = Number(_query.pageSize ?? 20);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const pageSize = Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? Math.min(parsedPageSize, 100) : 20;
    const offset = (Math.max(page, 1) - 1) * pageSize;
    const filters: SupabaseQuery['filters'] = [];
    let or: string | undefined;

    const q = typeof _query.q === 'string' ? _query.q.trim() : '';
    if (q) {
      const like = `*${q}*`;
      const clauses = [
        `title.ilike.${like}`,
        `subtitle.ilike.${like}`,
        `description.ilike.${like}`,
        `code.ilike.${like}`,
        `authors.cs.${toArrayLiteral([q])}`
      ];
      or = `(${clauses.join(',')})`;
    }

    if (_query.title && typeof _query.title === 'string') {
      filters.push({ column: 'title', operator: 'ilike', value: `*${_query.title}*` });
    }

    if (_query.code && typeof _query.code === 'string') {
      filters.push({ column: 'code', operator: 'ilike', value: `*${_query.code}*` });
    }

    if (_query.author && typeof _query.author === 'string') {
      filters.push({ column: 'authors', operator: 'cs', value: toArrayLiteral([_query.author]) });
    }

    if (_query.tags) {
      const tags = asArray(_query.tags);
      if (tags.length) {
        filters.push({ column: 'tags', operator: 'cs', value: toArrayLiteral(tags) });
      }
    }

    if (_query.genres) {
      const genres = asArray(_query.genres);
      if (genres.length) {
        filters.push({ column: 'genres', operator: 'cs', value: toArrayLiteral(genres) });
      }
    }

    if (_query.status && typeof _query.status === 'string') {
      filters.push({ column: 'status', operator: 'eq', value: _query.status });
    }

    const rows = await supabaseSelect<BookRow>('books', {
      filters,
      or,
      order: 'title.asc',
      limit: pageSize,
      offset
    });
    return rows.map(mapBookRow);
  }

  async create(input: Partial<BookEntity>): Promise<BookEntity> {
    const payload = mapBookUpdate(input);
    const row = await supabaseInsert<BookRow>('books', payload, { single: true });
    if (!row) {
      throw new Error('Failed to create book');
    }
    return mapBookRow(row as BookRow);
  }

  async update(id: string, input: Partial<BookEntity>): Promise<BookEntity> {
    const payload = mapBookUpdate(input);
    const row = await supabaseUpdate<BookRow>('books', payload, {
      filters: [{ column: 'id', operator: 'eq', value: id }],
      limit: 1
    }, { single: true });
    if (!row) {
      throw new Error('Failed to update book');
    }
    return mapBookRow(row as BookRow);
  }

  async updateStatus(id: string, status: BookStatus): Promise<BookEntity> {
    return this.update(id, { status });
  }

  async remove(id: string): Promise<void> {
    await supabaseDelete('books', {
      filters: [{ column: 'id', operator: 'eq', value: id }],
      limit: 1
    });
  }
}

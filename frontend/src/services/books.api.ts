import { apiRequest } from './http';

type BookSummary = {
  id: string;
  code?: string;
  title: string;
  authors?: string[];
  status?: 'active' | 'archived';
  availability?: Availability;
};

type BookDetail = {
  id: string;
  code?: string;
  title: string;
  description?: string;
};

type Availability = {
  total: number;
  available: number;
  checkedOut: number;
  archived: number;
};

export async function searchBooks(params: Record<string, string | string[]>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  });
  return apiRequest<BookSummary[]>(`/books?${query.toString()}`);
}

export async function getBook(id: string) {
  return apiRequest<{ book: BookDetail; availability: Availability }>(`/books/${id}`);
}

export async function getBookCopies(id: string) {
  return apiRequest<Array<{ id: string; barcode?: string; status: string }>>(`/books/${id}/copies`);
}

export async function createBook(payload: Record<string, unknown>) {
  return apiRequest(`/books`, { method: 'POST', body: payload });
}

export async function updateBook(id: string, payload: Record<string, unknown>) {
  return apiRequest(`/books/${id}`, { method: 'PATCH', body: payload });
}

export async function archiveBook(id: string) {
  return apiRequest(`/books/${id}/archive`, { method: 'POST' });
}

export async function restoreBook(id: string) {
  return apiRequest(`/books/${id}/restore`, { method: 'POST' });
}

export async function deleteBook(id: string) {
  return apiRequest(`/books/${id}`, { method: 'DELETE' });
}

export async function createCopy(bookId: string, payload: Record<string, unknown>) {
  return apiRequest(`/books/${bookId}/copies`, { method: 'POST', body: payload });
}

export async function updateCopy(bookId: string, copyId: string, payload: Record<string, unknown>) {
  return apiRequest(`/books/${bookId}/copies/${copyId}`, { method: 'PATCH', body: payload });
}

export async function deleteCopy(bookId: string, copyId: string) {
  return apiRequest(`/books/${bookId}/copies/${copyId}`, { method: 'DELETE' });
}

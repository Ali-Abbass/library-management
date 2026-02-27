import { apiRequest } from './http';

export type Loan = {
  id: string;
  copyId: string;
  dueAt: string;
  status: string;
};

export type LoanRequest = {
  id: string;
  userId: string;
  bookId: string;
  status: 'pending' | 'fulfilled' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  note?: string;
  userEmail?: string;
  userName?: string;
  bookTitle?: string;
  bookCode?: string;
};

export function checkout(input: { copyId?: string; copyCode?: string }, dueAt?: string) {
  return apiRequest<Loan>('/loans/checkout', { method: 'POST', body: { ...input, dueAt } });
}

export function checkoutToUser(input: { userId: string; copyId?: string; copyCode?: string; dueAt?: string; requestId?: string }) {
  return apiRequest<Loan>('/loans/checkout-to-user', { method: 'POST', body: input });
}

export function returnLoan(loanId: string) {
  return apiRequest<Loan>('/loans/return', { method: 'POST', body: { loanId } });
}

export function returnCopy(copyId: string) {
  return apiRequest<Loan>('/loans/return', { method: 'POST', body: { copyId } });
}

export function listLoans(userId?: string) {
  const query = new URLSearchParams();
  if (userId) {
    query.set('userId', userId);
  }
  const suffix = query.toString();
  return apiRequest<Loan[]>(`/loans${suffix ? `?${suffix}` : ''}`);
}

export function createCheckoutRequest(bookId: string, note?: string) {
  return apiRequest<LoanRequest>('/loans/requests', { method: 'POST', body: { bookId, note } });
}

export function listCheckoutRequests(status?: 'pending' | 'fulfilled' | 'rejected') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<LoanRequest[]>(`/loans/requests${query}`);
}

export function rejectCheckoutRequest(requestId: string, note?: string) {
  return apiRequest<LoanRequest>(`/loans/requests/${requestId}/reject`, { method: 'POST', body: { note } });
}

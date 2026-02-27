import { apiRequest } from './http';

type AnalyticsOverview = {
  totalLoans: number;
  topBorrowers: Array<{ userName?: string; userEmail?: string; count: number }>;
  mostBorrowedBooks: Array<{ title?: string; code?: string; count: number }>;
};

export function fetchAnalytics(from?: string, to?: string) {
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  return apiRequest<AnalyticsOverview>(`/analytics/overview?${query.toString()}`);
}

export function exportAnalyticsCsv(from?: string, to?: string) {
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  return apiRequest<string>(`/analytics/export?${query.toString()}`);
}

export function fetchLoanHistory(userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiRequest<Array<{ id: string; status: string; checkedOutAt?: string; dueAt?: string }>>(`/loans/history${query}`);
}

export function listUsers(status?: string, search?: string) {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (search) query.set('q', search);
  return apiRequest<Array<{ id: string; email: string; roles: string[]; status: string }>>(
    `/admin/users${query.toString() ? `?${query.toString()}` : ''}`
  );
}

export function approveUser(userId: string) {
  return apiRequest(`/admin/approvals`, { method: 'PATCH', body: { userId } });
}

export function updateUserRoles(userId: string, roles: string[]) {
  return apiRequest(`/admin/users/roles`, { method: 'PATCH', body: { userId, roles } });
}

export function runOverdueAlerts() {
  return apiRequest<{ processed: number }>(`/alerts/overdue/run`, { method: 'POST' });
}

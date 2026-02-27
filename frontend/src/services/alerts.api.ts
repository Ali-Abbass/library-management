import { apiRequest } from './http';

type Alert = {
  id: string;
  loanId: string;
  status: string;
  sentAt: string;
};

export function listAlerts() {
  return apiRequest<Alert[]>('/alerts');
}

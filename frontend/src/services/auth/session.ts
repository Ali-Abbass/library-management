export type Session = {
  userId: string;
  roles: string[];
  status: 'active' | 'pending_approval' | 'suspended' | 'unknown';
  accessToken: string;
  email?: string;
};

let currentSession: Session | null = null;

export function setSession(session: Session | null) {
  currentSession = session;
}

export function getSession(): Session | null {
  return currentSession;
}

import type { ReactNode } from 'react';
import { useAuth } from './auth-context';

type RoleGuardProps = {
  roles: string[];
  children: ReactNode;
};

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const { session } = useAuth();
  const allowed = session?.roles?.some((role) => roles.includes(role));

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}

import type { ReactNode } from 'react';

type AppShellProps = {
  header?: ReactNode;
  nav?: ReactNode;
  children: ReactNode;
};

export default function AppShell({ header, nav, children }: AppShellProps) {
  return (
    <div className="app-shell fade-in">
      <header className="app-header">
        {header}
      </header>
      {nav}
      <main className="content">{children}</main>
    </div>
  );
}

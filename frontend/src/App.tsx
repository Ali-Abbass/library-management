import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import GenreTrends from './components/admin/GenreTrends';
import AppShell from './components/layout/AppShell';
import AlertsPage from './pages/AlertsPage';
import MyLoansPage from './pages/MyLoansPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import PatronDashboardPage from './pages/PatronDashboardPage';
import SearchPage from './pages/SearchPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminCatalogPage from './pages/admin/AdminCatalogPage';
import AdminCheckoutRequestsPage from './pages/admin/AdminCheckoutRequestsPage';
import AdminRolesPage from './pages/admin/AdminRolesPage';
import AuthPage from './pages/AuthPage';
import { BellIcon, BookIcon, ChartIcon, LogoutIcon, SearchIcon, ShieldIcon, SparkleIcon, UserIcon } from './components/ui/Icons';
import { listAlerts } from './services/alerts.api';
import { useAuth } from './services/auth/auth-context';

type ViewId =
  | 'patron-dashboard'
  | 'search'
  | 'my-loans'
  | 'alerts'
  | 'admin-catalog'
  | 'admin-checkout-requests'
  | 'admin-analytics'
  | 'admin-roles'
  | 'pending-approval';

type View = {
  id: ViewId;
  label: string;
  roles?: string[];
  requiresActive?: boolean;
};

const views: View[] = [
  { id: 'patron-dashboard', label: 'For You', roles: ['patron'] },
  { id: 'search', label: 'Search' },
  { id: 'my-loans', label: 'My Loans', requiresActive: true },
  { id: 'alerts', label: 'Alerts' },
  { id: 'admin-catalog', label: 'Admin Catalog', roles: ['admin'] },
  { id: 'admin-checkout-requests', label: 'Checkout Requests', roles: ['admin', 'staff'] },
  { id: 'admin-analytics', label: 'Analytics', roles: ['admin', 'staff'] },
  { id: 'admin-roles', label: 'Users and Roles', roles: ['admin'] },
  { id: 'pending-approval', label: 'Approval Pending' }
];

const viewIcons: Record<ViewId, ReactNode> = {
  'patron-dashboard': <SparkleIcon />,
  search: <SearchIcon />,
  'my-loans': <BookIcon />,
  alerts: <BellIcon />,
  'admin-catalog': <BookIcon />,
  'admin-checkout-requests': <BellIcon />,
  'admin-analytics': <ChartIcon />,
  'admin-roles': <ShieldIcon />,
  'pending-approval': <UserIcon />
};

export default function App() {
  const { session, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ViewId>('search');
  const [alertsCount, setAlertsCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const isActive = session?.status === 'active';
  const allowedViews = useMemo(
    () =>
      session
        ? views.filter((view) => {
            if (view.roles && !view.roles.some((role) => session.roles.includes(role))) {
              return false;
            }
            if (view.requiresActive && !isActive) {
              return false;
            }
            if (view.id === 'pending-approval' && isActive) {
              return false;
            }
            return true;
          })
        : [],
    [isActive, session]
  );
  const [activeViewInitialized, setActiveViewInitialized] = useState(false);

  useEffect(() => {
    if (!session) {
      setActiveViewInitialized(false);
      return;
    }
    if (!activeViewInitialized && allowedViews.length > 0) {
      setActiveView(allowedViews[0].id);
      setActiveViewInitialized(true);
      return;
    }
    if (allowedViews.length > 0 && !allowedViews.some((view) => view.id === activeView)) {
      setActiveView(allowedViews[0].id);
    }
  }, [activeView, allowedViews, activeViewInitialized, session]);

  useEffect(() => {
    if (!session) {
      setAlertsCount(0);
      return;
    }
    listAlerts().then((alerts) => setAlertsCount(alerts.length)).catch(() => setAlertsCount(0));
  }, [session]);

  useEffect(() => {
    if (!profileOpen) {
      return;
    }
    const close = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [profileOpen]);

  const content = useMemo(() => {
    if (!session) {
      return null;
    }
    if (!isActive && activeView === 'pending-approval') {
      return <PendingApprovalPage />;
    }
    switch (activeView) {
      case 'patron-dashboard':
        return <PatronDashboardPage />;
      case 'search':
        return <SearchPage />;
      case 'my-loans':
        return <MyLoansPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'admin-catalog':
        return <AdminCatalogPage />;
      case 'admin-checkout-requests':
        return <AdminCheckoutRequestsPage />;
      case 'admin-analytics':
        return (
          <div>
            <AdminAnalyticsPage />
            <GenreTrends />
          </div>
        );
      case 'admin-roles':
        return <AdminRolesPage />;
      case 'pending-approval':
        return <PendingApprovalPage />;
      default:
        return <SearchPage />;
    }
  }, [activeView, isActive, session]);

  if (loading) {
    return <div className="auth-layout">Loading session...</div>;
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <AppShell
      header={
        <>
          <div>
            <h1 className="brand-title">Library Management</h1>
            <div className="brand-subtitle">Discovery, lending, and analytics in one place.</div>
          </div>
          <div className="profile-menu" ref={profileRef}>
            <button
              type="button"
              className="profile-trigger"
              aria-label="Open profile menu"
              onClick={() => setProfileOpen((value) => !value)}
            >
              {(session.email ?? session.userId).slice(0, 1).toUpperCase()}
            </button>
            {profileOpen ? (
              <div className="profile-dropdown">
                <button
                  type="button"
                  className="profile-item"
                  onClick={() => {
                    setActiveView('alerts');
                    setProfileOpen(false);
                  }}
                >
                  <span className="profile-item-main">
                    <BellIcon size={16} />
                    Alerts
                  </span>
                  <span className="pill">{alertsCount}</span>
                </button>
                <div className="profile-item muted">
                  <span className="profile-item-main">
                    <UserIcon size={16} />
                    {session.email ?? session.userId}
                  </span>
                </div>
                <button
                  type="button"
                  className="profile-item"
                  disabled={signingOut}
                  onClick={async () => {
                    if (signingOut) return;
                    setSigningOut(true);
                    try {
                      await signOut();
                    } finally {
                      setSigningOut(false);
                    }
                  }}
                >
                  <span className="profile-item-main">
                    <LogoutIcon size={16} />
                    {signingOut ? 'Signing out...' : 'Sign out'}
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        </>
      }
      nav={
        <nav className="nav-panel" aria-label="App sections">
          {allowedViews.map((view) => (
            <button
              key={view.id}
              type="button"
              className="nav-button"
              data-active={activeView === view.id}
              onClick={() => setActiveView(view.id)}
            >
              <span className="nav-label">
                {viewIcons[view.id]}
                {view.label}
              </span>
              {view.requiresActive && !isActive ? <span className="pill">Approval required</span> : null}
            </button>
          ))}
        </nav>
      }
    >
      {!isActive && (
        <div className="panel">
          <strong>Account pending approval.</strong> You can browse the catalog, but borrowing is disabled.
        </div>
      )}
      {content}
    </AppShell>
  );
}

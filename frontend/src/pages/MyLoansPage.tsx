import { useEffect, useState } from 'react';
import ReturnButton from '../components/loans/ReturnButton';
import { listLoans } from '../services/loans.api';
import { useAuth } from '../services/auth/auth-context';
import { formatReadableId } from '../utils/format';

export default function MyLoansPage() {
  const [loans, setLoans] = useState<Array<{ id: string; status: string; dueAt?: string }>>([]);
  const { session } = useAuth();
  const isAdmin = !!session?.roles?.includes('admin');
  const isStaffOnly = !!session?.roles?.includes('staff') && !isAdmin;
  const canCheckIn = !!session?.roles?.some((role) => role === 'admin' || role === 'staff');
  const title = isAdmin || isStaffOnly ? 'Loans' : 'My Loans';
  const subtitle = isAdmin
    ? 'View and manage all loans in the system.'
    : isStaffOnly
      ? 'View loans processed by your account.'
      : 'Track what you have checked out and return items.';

  useEffect(() => {
    listLoans().then(setLoans).catch(() => setLoans([]));
  }, []);

  const markReturned = (loanId: string) => {
    setLoans((current) =>
      current.map((loan) => (loan.id === loanId ? { ...loan, status: 'returned' } : loan))
    );
  };

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
        <span className="pill">{loans.length} active</span>
      </div>
      <div className="grid grid-2">
        {loans.length === 0 ? (
          <div className="card">
            <span className="tag">No loans</span>
            <strong>You are all caught up</strong>
            <span className="muted">Check out a book to start tracking due dates here.</span>
          </div>
        ) : null}
        {loans.map((loan) => (
          <div key={loan.id} className={`card ${loan.status === 'returned' ? 'returned-loan-card' : ''}`}>
            <span className="tag">Loan</span>
            <strong>{formatReadableId('LOAN', loan.id)}</strong>
            <div className={`status ${loan.status === 'overdue' ? 'overdue' : loan.status === 'returned' ? 'returned' : ''}`}>
              {loan.status}
            </div>
            {loan.dueAt ? <div className="muted">Due {new Date(loan.dueAt).toLocaleDateString()}</div> : null}
            {loan.status !== 'returned' && canCheckIn ? (
              <ReturnButton loanId={loan.id} onReturned={markReturned} />
            ) : null}
            {loan.status === 'returned' ? <span className="pill">Checked in</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

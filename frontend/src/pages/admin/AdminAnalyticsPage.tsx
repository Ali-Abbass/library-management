import { useEffect, useState } from 'react';
import { BookIcon, ChartIcon, UserIcon } from '../../components/ui/Icons';
import { exportAnalyticsCsv, fetchAnalytics, fetchLoanHistory } from '../../services/admin.api';
import { formatReadableId } from '../../utils/format';

type AnalyticsOverview = {
  totalLoans: number;
  topBorrowers?: Array<{ userName?: string; userEmail?: string; count: number }>;
  mostBorrowedBooks?: Array<{ title?: string; code?: string; count: number }>;
};

type LoanHistory = Array<{ id: string; status: string; checkedOutAt?: string; dueAt?: string }>;

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [history, setHistory] = useState<LoanHistory>([]);
  const [exportStatus, setExportStatus] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics().then(setOverview).catch(() => setOverview(null));
    fetchLoanHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const onExport = () => {
    if (exporting) return;
    setExporting(true);
    setExportStatus('');
    exportAnalyticsCsv()
      .then((csv) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'analytics.csv';
        link.click();
        URL.revokeObjectURL(url);
        setExportStatus('Exported CSV.');
      })
      .catch(() => setExportStatus('Export failed.'))
      .finally(() => setExporting(false));
  };

  const topBorrowers = overview?.topBorrowers ?? [];
  const mostBorrowed = overview?.mostBorrowedBooks ?? [];
  const borrowerMax = topBorrowers.length > 0 ? Math.max(...topBorrowers.map((item) => item.count)) : 1;
  const bookMax = mostBorrowed.length > 0 ? Math.max(...mostBorrowed.map((item) => item.count)) : 1;

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <div>
          <h2>Analytics</h2>
          <p className="muted">Borrowing trends and activity export.</p>
        </div>
        <button type="button" className="button" onClick={onExport} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
      {exportStatus ? <div className="muted">{exportStatus}</div> : null}
      <div className="analytics-overview-grid">
        <div className="card analytics-total-card">
          <span className="tag card-tag">
            <ChartIcon size={14} />
            Total circulation
          </span>
          <strong>Total loans</strong>
          <div className="analytics-total-value">{overview?.totalLoans ?? 0}</div>
          <span className="muted">Across all patrons and checkout activity.</span>
        </div>
        <div className="card analytics-leaderboard">
          <div className="analytics-leaderboard-head">
            <span className="tag card-tag">
              <UserIcon size={14} />
              Top Borrowers
            </span>
          </div>
          {topBorrowers.length === 0 ? <span className="muted">No borrower data available.</span> : null}
          {topBorrowers.map((borrower, index) => {
            const ratio = Math.max(8, Math.round((borrower.count / borrowerMax) * 100));
            return (
              <div key={`${borrower.userEmail ?? borrower.userName ?? 'user'}-${borrower.count}`} className="leader-row">
                <div className="leader-rank">{index + 1}</div>
                <div className="leader-main">
                  <div className="leader-line">
                    <strong>{borrower.userName ?? borrower.userEmail ?? 'Unknown user'}</strong>
                    <span className="leader-score">{borrower.count}</span>
                  </div>
                  <div className="leader-bar-track">
                    <div className="leader-bar-fill" style={{ width: `${ratio}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card analytics-leaderboard">
          <div className="analytics-leaderboard-head">
            <span className="tag card-tag">
              <BookIcon size={14} />
              Most Borrowed Books
            </span>
          </div>
          {mostBorrowed.length === 0 ? <span className="muted">No book trend data available.</span> : null}
          {mostBorrowed.map((book, index) => {
            const ratio = Math.max(8, Math.round((book.count / bookMax) * 100));
            return (
              <div key={`${book.code ?? book.title ?? 'book'}-${book.count}`} className="leader-row">
                <div className="leader-rank">{index + 1}</div>
                <div className="leader-main">
                  <div className="leader-line">
                    <strong>{book.title ?? book.code ?? 'Unknown title'}</strong>
                    <span className="leader-score">{book.count}</span>
                  </div>
                  <div className="leader-sub">{book.code ?? 'No code'}</div>
                  <div className="leader-bar-track">
                    <div className="leader-bar-fill" style={{ width: `${ratio}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <span className="tag">Loan History</span>
          {history.map((loan) => (
            <div key={loan.id} className="muted">
              {formatReadableId('LOAN', loan.id)} · {loan.status} · {loan.checkedOutAt ? new Date(loan.checkedOutAt).toLocaleDateString() : 'No date'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { listAlerts } from '../services/alerts.api';
import { runOverdueAlerts } from '../services/admin.api';
import { useAuth } from '../services/auth/auth-context';
import { formatReadableId } from '../utils/format';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Array<{ id: string; loanId: string }>>([]);
  const [status, setStatus] = useState('');
  const [running, setRunning] = useState(false);
  const { session } = useAuth();
  const isPrivileged = session?.roles?.some((role) => role === 'admin' || role === 'staff');

  useEffect(() => {
    listAlerts().then(setAlerts).catch(() => setAlerts([]));
  }, []);

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <div>
          <h2>Alerts</h2>
          <p className="muted">Overdue notifications and status updates.</p>
        </div>
        <span className="pill">{alerts.length} alerts</span>
      </div>
      {isPrivileged ? (
        <div className="split">
          <button
            type="button"
            className="button secondary"
            disabled={running}
            onClick={() => {
              if (running) return;
              setRunning(true);
              setStatus('');
              runOverdueAlerts()
                .then((res) => setStatus(`Processed ${res.processed} overdue loans.`))
                .catch(() => setStatus('Failed to run overdue job.'))
                .finally(() => setRunning(false));
            }}
          >
            {running ? 'Running scan...' : 'Run overdue scan'}
          </button>
          {status ? <span className="muted">{status}</span> : null}
        </div>
      ) : null}
      <div className="grid grid-2">
        {alerts.length === 0 ? (
          <div className="card">
            <span className="tag">No alerts</span>
            <strong>You are all set</strong>
            <span className="muted">Overdue notifications will appear here.</span>
          </div>
        ) : null}
        {alerts.map((alert) => (
          <div key={alert.id} className="card">
            <span className="tag">Alert</span>
            <strong>{formatReadableId('ALERT', alert.id)}</strong>
            <div className="muted">Loan {formatReadableId('LOAN', alert.loanId)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

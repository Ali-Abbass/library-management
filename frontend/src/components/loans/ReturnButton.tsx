import { useState } from 'react';
import { returnLoan } from '../../services/loans.api';

type ReturnButtonProps = {
  loanId: string;
  onReturned?: (loanId: string) => void;
};

export default function ReturnButton({ loanId, onReturned }: ReturnButtonProps) {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const onReturn = () => {
    if (loading) return;
    setLoading(true);
    returnLoan(loanId)
      .then(() => {
        setStatus('Returned');
        onReturned?.(loanId);
      })
      .catch(() => setStatus('Failed'))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <button type="button" className="button secondary" onClick={onReturn} disabled={loading}>
        {loading ? 'Returning...' : 'Return'}
      </button>
      {status && <span className="muted">{status}</span>}
    </div>
  );
}

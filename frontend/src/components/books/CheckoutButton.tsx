import { useState } from 'react';
import { checkout } from '../../services/loans.api';
import { useAuth } from '../../services/auth/auth-context';

type CheckoutButtonProps = {
  copyId: string;
  copyCode?: string;
};

export default function CheckoutButton({ copyId, copyCode }: CheckoutButtonProps) {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const disabled = session?.status !== 'active' || loading;

  const onCheckout = () => {
    if (loading) return;
    setLoading(true);
    checkout(copyCode ? { copyCode } : { copyId })
      .then(() => setStatus('Checked out'))
      .catch(() => setStatus('Failed'))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <button type="button" className="button" onClick={onCheckout} disabled={disabled}>
        {loading ? 'Checking out...' : 'Check Out'}
      </button>
      {status && <span className="muted">{status}</span>}
    </div>
  );
}

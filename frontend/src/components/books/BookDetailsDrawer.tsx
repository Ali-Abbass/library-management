import { useEffect, useMemo, useState } from 'react';
import { listUsers } from '../../services/admin.api';
import { createCopy, deleteCopy, getBook, getBookCopies } from '../../services/books.api';
import { checkoutToUser, createCheckoutRequest, returnCopy } from '../../services/loans.api';
import { useAuth } from '../../services/auth/auth-context';
import { SparkleIcon } from '../ui/Icons';
import AvailabilityBadge from './AvailabilityBadge';
import ReadingTime from './ReadingTime';
import SimilarBooks from './SimilarBooks';

type BookDetail = {
  id: string;
  code?: string;
  title: string;
  description?: string;
  status?: 'active' | 'archived';
};

type Availability = {
  total: number;
  available: number;
  checkedOut: number;
  archived: number;
};

type BookCopy = {
  id: string;
  barcode?: string;
  status: string;
};

type CheckoutContext = {
  requestId?: string;
  userId?: string;
};

type UserOption = {
  id: string;
  email: string;
  roles: string[];
  status: string;
};

type BookDetailsDrawerProps = {
  bookId: string | null;
  onClose: () => void;
  adminMode?: boolean;
  onCopiesChanged?: () => void;
  checkoutContext?: CheckoutContext | null;
  onRequestHandled?: () => void;
};

export default function BookDetailsDrawer({
  bookId,
  onClose,
  adminMode = false,
  onCopiesChanged,
  checkoutContext,
  onRequestHandled
}: BookDetailsDrawerProps) {
  const { session } = useAuth();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [removingCopyId, setRemovingCopyId] = useState<string | null>(null);
  const [addingCopy, setAddingCopy] = useState(false);

  const [patronQuery, setPatronQuery] = useState('');
  const [patronLoading, setPatronLoading] = useState(false);
  const [patronOptions, setPatronOptions] = useState<UserOption[]>([]);
  const [selectedPatronId, setSelectedPatronId] = useState<string>('');
  const [requesting, setRequesting] = useState(false);
  const [checkoutCopyId, setCheckoutCopyId] = useState<string | null>(null);
  const [checkinCopyId, setCheckinCopyId] = useState<string | null>(null);

  const isPrivileged = useMemo(
    () => !!session?.roles?.some((role) => role === 'admin' || role === 'staff'),
    [session?.roles]
  );
  const isAdmin = useMemo(() => !!session?.roles?.includes('admin'), [session?.roles]);
  const isStaffOnly = useMemo(() => !!session?.roles?.includes('staff') && !isAdmin, [isAdmin, session?.roles]);
  const isPatronOnly = useMemo(
    () => !!session?.roles?.includes('patron') && !isPrivileged,
    [isPrivileged, session?.roles]
  );

  const loadDetails = () => {
    if (!bookId) {
      setBook(null);
      setAvailability(null);
      setCopies([]);
      setError('');
      setActionStatus('');
      return;
    }
    Promise.all([getBook(bookId), getBookCopies(bookId)])
      .then(([data, list]) => {
        setBook(data.book);
        setAvailability(data.availability);
        setCopies(list);
        setError('');
      })
      .catch(() => {
        setBook(null);
        setAvailability(null);
        setCopies([]);
        setError('Book not found.');
      });
  };

  useEffect(() => {
    loadDetails();
  }, [bookId]);

  useEffect(() => {
    if (!bookId) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bookId, onClose]);

  useEffect(() => {
    if (checkoutContext?.userId) {
      setSelectedPatronId(checkoutContext.userId);
    }
  }, [checkoutContext?.userId]);

  useEffect(() => {
    if (!adminMode || !isAdmin || patronQuery.trim().length < 2) {
      setPatronOptions([]);
      return;
    }
    setPatronLoading(true);
    listUsers('active', patronQuery.trim())
      .then((users) => {
        const patrons = users.filter((user) => user.roles.includes('patron'));
        setPatronOptions(patrons);
      })
      .catch(() => setPatronOptions([]))
      .finally(() => setPatronLoading(false));
  }, [adminMode, isAdmin, patronQuery]);

  const onAddCopy = async () => {
    if (!bookId || busy) return;
    setBusy(true);
    setAddingCopy(true);
    try {
      await createCopy(bookId, { status: 'available' });
      setActionStatus('Copy added.');
      loadDetails();
      onCopiesChanged?.();
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : 'Failed to add copy');
    } finally {
      setBusy(false);
      setAddingCopy(false);
    }
  };

  const onDeleteCopy = async (copyId: string) => {
    if (!bookId || busy) return;
    setBusy(true);
    setRemovingCopyId(copyId);
    try {
      await deleteCopy(bookId, copyId);
      setActionStatus('Copy removed.');
      loadDetails();
      onCopiesChanged?.();
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : 'Failed to remove copy');
    } finally {
      setBusy(false);
      setRemovingCopyId(null);
    }
  };

  const onRequestCheckout = async () => {
    if (!bookId || requesting) return;
    setRequesting(true);
    setActionStatus('');
    try {
      await createCheckoutRequest(bookId);
      setActionStatus('Checkout request submitted. Staff will process it.');
      onRequestHandled?.();
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setRequesting(false);
    }
  };

  const onCheckoutToPatron = async (copy: BookCopy) => {
    if (!selectedPatronId) {
      setActionStatus('Select a patron first.');
      return;
    }
    setCheckoutCopyId(copy.id);
    setActionStatus('');
    try {
      await checkoutToUser({
        userId: selectedPatronId,
        copyId: copy.id,
        copyCode: copy.barcode,
        requestId: checkoutContext?.requestId
      });
      setActionStatus('Book checked out to selected patron.');
      loadDetails();
      onCopiesChanged?.();
      onRequestHandled?.();
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : 'Failed to checkout to patron');
    } finally {
      setCheckoutCopyId(null);
    }
  };

  const onCheckInCopy = async (copy: BookCopy) => {
    if (checkinCopyId) return;
    setCheckinCopyId(copy.id);
    setActionStatus('');
    try {
      await returnCopy(copy.id);
      setActionStatus('Copy checked in successfully.');
      loadDetails();
      onCopiesChanged?.();
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : 'Failed to check in copy');
    } finally {
      setCheckinCopyId(null);
    }
  };

  if (!bookId) {
    return null;
  }

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="drawer-panel fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Book details"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-header">
          <h3>Book details</h3>
          <button type="button" className="button secondary" onClick={onClose}>
            Close
          </button>
        </div>
        {!book && !error ? <div className="muted">Loading...</div> : null}
        {error ? <div className="muted">{error}</div> : null}
        {book ? (
          <>
            <div className="panel-header">
              <div>
                <h2>{book.title}</h2>
                {book.code ? <div className="muted">{book.code}</div> : null}
                {book.status === 'archived' && <div className="status archived">Archived</div>}
              </div>
              {availability && (
                <AvailabilityBadge
                  total={availability.total}
                  available={availability.available}
                  checkedOut={availability.checkedOut}
                  archived={availability.archived}
                />
              )}
            </div>
            <p className="muted">{book.description}</p>
            <div className="grid">
              <div className="card">
                <div className="panel-header" style={{ marginBottom: 0 }}>
                  <span className="tag">Copies</span>
                  {adminMode ? (
                    <button type="button" className="button secondary" onClick={onAddCopy} disabled={busy}>
                      {addingCopy ? 'Adding...' : 'Add Copy'}
                    </button>
                  ) : null}
                </div>
                {adminMode && isAdmin ? (
                  <div className="form-row" style={{ marginTop: '0.6rem' }}>
                    <input
                      className="input"
                      value={patronQuery}
                      onChange={(event) => setPatronQuery(event.target.value)}
                      placeholder="Search patron by email or name"
                    />
                    <select
                      className="input"
                      value={selectedPatronId}
                      onChange={(event) => setSelectedPatronId(event.target.value)}
                    >
                      <option value="">Select patron</option>
                      {patronOptions.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email}
                        </option>
                      ))}
                    </select>
                    {patronLoading ? <span className="muted">Searching patrons...</span> : null}
                    {checkoutContext?.requestId ? <span className="pill">Fulfilling request</span> : null}
                  </div>
                ) : null}
                {adminMode && isStaffOnly && checkoutContext?.userId ? (
                  <div className="muted" style={{ marginTop: '0.6rem' }}>
                    Patron fixed from request: {selectedPatronId}
                  </div>
                ) : null}
                {isPatronOnly ? (
                  <div className="split" style={{ marginTop: '0.6rem' }}>
                    <button type="button" className="button" disabled={requesting} onClick={onRequestCheckout}>
                      {requesting ? 'Requesting...' : 'Request Checkout'}
                    </button>
                  </div>
                ) : null}
                {copies.length === 0 ? <div className="muted">No copies found.</div> : null}
                {actionStatus ? <div className="muted">{actionStatus}</div> : null}
                {copies.map((copy) => (
                  <div key={copy.id} className="split" style={{ alignItems: 'center' }}>
                    <div>
                      <div className="muted">Copy code {copy.barcode ?? 'N/A'}</div>
                      <div className={`status ${copy.status === 'overdue' ? 'overdue' : ''}`}>{copy.status}</div>
                    </div>
                    <div className="split" style={{ gap: '0.5rem' }}>
                      {adminMode && copy.status === 'available' && book.status !== 'archived' ? (
                        <button
                          type="button"
                          className="button"
                          disabled={!selectedPatronId || checkoutCopyId === copy.id || (isStaffOnly && !checkoutContext?.requestId)}
                          onClick={() => onCheckoutToPatron(copy)}
                        >
                          {checkoutCopyId === copy.id ? 'Checking out...' : 'Checkout to Patron'}
                        </button>
                      ) : null}
                      {adminMode && copy.status === 'checked_out' ? (
                        <button
                          type="button"
                          className="button secondary"
                          disabled={checkinCopyId === copy.id}
                          onClick={() => onCheckInCopy(copy)}
                        >
                          {checkinCopyId === copy.id ? 'Checking in...' : 'Check in copy'}
                        </button>
                      ) : null}
                      {adminMode ? (
                        <button
                          type="button"
                          className="button danger"
                          disabled={busy || copy.status === 'checked_out' || checkinCopyId === copy.id}
                          onClick={() => onDeleteCopy(copy.id)}
                        >
                          {removingCopyId === copy.id ? 'Removing...' : 'Remove'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <span className="ai-badge">
                  <SparkleIcon size={14} />
                  AI Insights
                </span>
                <span className="muted">Quick guidance to help decide if this book is a good fit.</span>
                <ReadingTime bookId={book.id} />
                <SimilarBooks bookId={book.id} />
              </div>
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}

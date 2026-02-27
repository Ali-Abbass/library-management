import { useEffect, useState } from 'react';
import BookDetailsDrawer from '../../components/books/BookDetailsDrawer';
import { listCheckoutRequests, rejectCheckoutRequest, type LoanRequest } from '../../services/loans.api';

export default function AdminCheckoutRequestsPage() {
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [status, setStatus] = useState('');
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const loadRequests = () => {
    return listCheckoutRequests('pending').then(setRequests).catch(() => setRequests([]));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <div>
          <h2>Checkout Requests</h2>
          <p className="muted">Patron requests waiting for staff/admin fulfillment.</p>
        </div>
        <span className="pill">{requests.length} pending</span>
      </div>
      {status ? <div className="muted">{status}</div> : null}
      <div className="grid">
        {requests.length === 0 ? (
          <div className="card">
            <span className="tag">No requests</span>
            <strong>All requests are processed</strong>
          </div>
        ) : null}
        {requests.map((request) => (
          <div key={request.id} className="card">
            <span className="tag">Request</span>
            <strong>{request.bookTitle ?? request.bookCode ?? request.bookId}</strong>
            <span className="muted">Patron: {request.userEmail ?? request.userId}</span>
            {request.note ? <span className="muted">Note: {request.note}</span> : null}
            <div className="split">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setSelectedBookId(request.bookId);
                  setSelectedRequest(request);
                }}
              >
                Fulfill in drawer
              </button>
              <button
                type="button"
                className="button danger"
                disabled={requestActionId === request.id}
                onClick={async () => {
                  if (requestActionId) return;
                  setRequestActionId(request.id);
                  try {
                    await rejectCheckoutRequest(request.id);
                    await loadRequests();
                    setStatus('Request rejected.');
                  } catch (error) {
                    setStatus(error instanceof Error ? error.message : 'Failed to reject request');
                  } finally {
                    setRequestActionId(null);
                  }
                }}
              >
                {requestActionId === request.id ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <BookDetailsDrawer
        bookId={selectedBookId}
        onClose={() => {
          setSelectedBookId(null);
          setSelectedRequest(null);
        }}
        adminMode
        checkoutContext={selectedRequest ? { requestId: selectedRequest.id, userId: selectedRequest.userId } : null}
        onRequestHandled={loadRequests}
      />
    </div>
  );
}

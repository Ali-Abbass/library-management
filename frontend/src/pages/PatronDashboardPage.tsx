import { useEffect, useState } from 'react';
import BookDetailsDrawer from '../components/books/BookDetailsDrawer';
import { SparkleIcon, BookIcon } from '../components/ui/Icons';
import { fetchPatronRecommendations, type PatronRecommendation } from '../services/ai.api';

export default function PatronDashboardPage() {
  const [items, setItems] = useState<PatronRecommendation[]>([]);
  const [mode, setMode] = useState<'personalized' | 'starter'>('starter');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const loadRecommendations = (refresh = false) => {
    setStatus('loading');
    fetchPatronRecommendations(refresh)
      .then((response) => {
        setItems(response.items ?? []);
        setMode(response.mode);
        setUpdatedAt(response.generatedAt);
        setStatus('idle');
      })
      .catch(() => {
        setItems([]);
        setStatus('error');
      })
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <>
      <section className="patron-hero panel fade-in">
        <div className="patron-hero-content">
          <span className="ai-badge">
            <SparkleIcon size={14} />
            AI Picks For You
          </span>
          <h2>Find your next borrow in seconds</h2>
          <p className="muted">
            {mode === 'personalized'
              ? 'Based on your recent borrowing behavior and catalog context.'
              : 'Starter picks generated from active catalog trends to get you reading quickly.'}
          </p>
          <div className="split" style={{ alignItems: 'center' }}>
            <button
              type="button"
              className="button"
              disabled={refreshing || status === 'loading'}
              onClick={() => {
                setRefreshing(true);
                loadRecommendations(true);
              }}
            >
              {refreshing ? 'Refreshing AI picks...' : 'Refresh AI Picks'}
            </button>
            {updatedAt ? <span className="muted">Updated {new Date(updatedAt).toLocaleString()}</span> : null}
          </div>
        </div>
      </section>

      <section className="panel fade-in">
        <div className="panel-header">
          <div>
            <h3>Recommended to borrow</h3>
            <p className="muted">Curated with one efficient AI pass to reduce API usage.</p>
          </div>
          <span className="pill">{items.length} picks</span>
        </div>

        {status === 'error' ? <div className="muted">Could not load AI suggestions right now.</div> : null}

        {featured ? (
          <article className="card patron-featured">
            <span className="tag card-tag">
              <SparkleIcon size={14} />
              Top match
            </span>
            <strong>{featured.title ?? featured.code ?? featured.id}</strong>
            {featured.code ? <span className="muted">{featured.code}</span> : null}
            <span>{featured.reason}</span>
            <span className="muted">Match confidence {Math.round(featured.confidence * 100)}%</span>
            <button type="button" className="button" onClick={() => setSelectedBookId(featured.id)}>
              View details
            </button>
          </article>
        ) : status === 'loading' ? (
          <div className="muted">Loading recommendations...</div>
        ) : null}

        <div className="grid grid-2" style={{ marginTop: '1rem' }}>
          {rest.map((item) => (
            <article key={item.id} className="card">
              <span className="tag card-tag">
                <BookIcon size={14} />
                AI suggestion
              </span>
              <strong>{item.title ?? item.code ?? item.id}</strong>
              {item.code ? <span className="muted">{item.code}</span> : null}
              <span className="muted">{item.reason}</span>
              <span className="muted">Confidence {Math.round(item.confidence * 100)}%</span>
              <button type="button" className="button secondary" onClick={() => setSelectedBookId(item.id)}>
                View details
              </button>
            </article>
          ))}
        </div>
      </section>

      <BookDetailsDrawer bookId={selectedBookId} onClose={() => setSelectedBookId(null)} />
    </>
  );
}

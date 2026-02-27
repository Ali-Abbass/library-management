import { useEffect, useState } from 'react';
import BookDetailsDrawer from '../components/books/BookDetailsDrawer';
import SemanticSearchPanel from '../components/search/SemanticSearchPanel';
import { BookIcon, SearchIcon, UserIcon } from '../components/ui/Icons';
import { searchBooks } from '../services/books.api';

type BookSummary = {
  id: string;
  code?: string;
  title: string;
  authors?: string[];
  availability?: {
    total: number;
    available: number;
    checkedOut: number;
    archived: number;
  };
};

export default function SearchPage() {
  const [results, setResults] = useState<BookSummary[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const runSearch = (term: string) => {
    setStatus('loading');
    searchBooks({ q: term })
      .then((items) => {
        setResults(items);
        setStatus('idle');
      })
      .catch(() => {
        setResults([]);
        setStatus('error');
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    runSearch(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <div>
          <h2>Search the catalog</h2>
          <p className="muted">Search by title, author, tags, or genres.</p>
        </div>
        <span className="pill">{results.length} results</span>
      </div>
      <div className="split">
        <div className="input-with-icon">
          <SearchIcon size={16} className="input-icon" />
        <input
          className="input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, description, or code"
        />
        </div>
        <span className="pill">{status === 'loading' ? 'Searching…' : 'Live search'}</span>
      </div>
      {status === 'error' && <div className="muted">Search failed. Check the API and try again.</div>}
      <div className="grid grid-2" style={{ marginTop: '1rem' }}>
        {results.length === 0 && status !== 'loading' ? (
          <div className="card">
            <span className="tag">No results</span>
            <strong>Try refining your search</strong>
            <span className="muted">Search by title, author, tags, or genres.</span>
          </div>
        ) : null}
        {results.map((book) => (
          <div key={book.id} className="card">
            <span className="tag card-tag">
              <BookIcon size={14} />
              Book
            </span>
            <strong>{book.title}</strong>
            {book.code ? <span className="muted">{book.code}</span> : null}
            {book.authors?.length ? (
              <span className="muted detail-row">
                <UserIcon size={14} />
                {book.authors.join(', ')}
              </span>
            ) : null}
            {book.availability ? (
              <span className="muted detail-row">
                Available {book.availability.available}/{book.availability.total}
              </span>
            ) : null}
            <button type="button" className="button secondary" onClick={() => setSelectedBookId(book.id)}>
              View details
            </button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <SemanticSearchPanel embedded />
      </div>
      <BookDetailsDrawer bookId={selectedBookId} onClose={() => setSelectedBookId(null)} />
    </div>
  );
}

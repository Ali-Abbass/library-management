import { useState } from 'react';
import { semanticSearch, suggestSemanticQuery } from '../../services/ai.api';
import { SearchIcon, SparkleIcon } from '../ui/Icons';

type SearchItem = {
  id: string;
  title?: string;
  code?: string;
  score?: number;
};

type SemanticSearchPanelProps = {
  embedded?: boolean;
};

export default function SemanticSearchPanel({ embedded = false }: SemanticSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [suggestedQuery, setSuggestedQuery] = useState('');
  const [reasons, setReasons] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'searching' | 'suggesting'>('idle');

  const runSearch = (inputQuery: string) => {
    const effectiveQuery = inputQuery.trim();
    if (!effectiveQuery) {
      setResults([]);
      return;
    }
    setStatus('searching');
    semanticSearch(effectiveQuery)
      .then((res) => setResults(res.results))
      .catch(() => setResults([]))
      .finally(() => setStatus('idle'));
  };

  const runSuggest = () => {
    if (!query.trim()) {
      setSuggestedQuery('');
      setReasons([]);
      return;
    }
    setStatus('suggesting');
    suggestSemanticQuery(query)
      .then((res) => {
        setSuggestedQuery(res.suggested);
        setReasons(res.reasons ?? []);
      })
      .catch(() => {
        setSuggestedQuery('');
        setReasons([]);
      })
      .finally(() => setStatus('idle'));
  };

  return (
    <div className={embedded ? 'card fade-in' : 'panel fade-in'}>
      <div className="panel-header">
        <div>
          <h2>{embedded ? 'AI-Powered Search' : 'Semantic Search'}</h2>
          <p className="muted">Search by meaning, not just keywords.</p>
        </div>
        <span className="pill">{results.length} results</span>
      </div>
      <div className="split">
        <div className="input-with-icon">
          <SearchIcon size={16} className="input-icon" />
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try 'modern library design'" />
        </div>
        <button type="button" className="button" onClick={() => runSearch(query)} disabled={status !== 'idle'}>
          {status === 'searching' ? 'Searching...' : 'Search'}
        </button>
        <button type="button" className="button secondary" onClick={runSuggest} disabled={status !== 'idle'}>
          <span className="button-with-icon">
            <SparkleIcon size={14} />
            {status === 'suggesting' ? 'Refining...' : 'Refine with AI'}
          </span>
        </button>
      </div>
      {suggestedQuery ? (
        <div className="panel" style={{ marginTop: '1rem', padding: '1rem' }}>
          <div className="split" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Suggested query:</strong> {suggestedQuery}
              {reasons.map((reason) => (
                <div key={reason} className="muted">
                  {reason}
                </div>
              ))}
            </div>
            <button type="button" className="button secondary" onClick={() => runSearch(suggestedQuery)}>
              Use suggestion
            </button>
          </div>
        </div>
      ) : null}
      <div className="grid grid-2" style={{ marginTop: '1rem' }}>
        {results.map((item) => (
          <div key={item.id} className="card">
            <span className="tag card-tag">
              <SparkleIcon size={13} />
              Result
            </span>
            <strong>{item.title ?? item.id}</strong>
            {item.code ? <span className="muted">{item.code}</span> : null}
            {typeof item.score === 'number' ? <span className="muted">Relevance {item.score.toFixed(2)}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { fetchSimilar } from '../../services/ai.api';

type SimilarBook = { id: string; title?: string; code?: string; reason: string };

type SimilarBooksProps = {
  bookId: string;
};

export default function SimilarBooks({ bookId }: SimilarBooksProps) {
  const [items, setItems] = useState<SimilarBook[]>([]);

  useEffect(() => {
    fetchSimilar(bookId).then(setItems).catch(() => setItems([]));
  }, [bookId]);

  const describeReason = (reason: string) => {
    if (reason.startsWith('genre:')) {
      const genre = reason.slice('genre:'.length);
      return `Similar genre: ${genre}`;
    }
    if (reason === 'tag-match') {
      return 'Similar themes and tags';
    }
    if (reason === 'semantic-match') {
      return 'Similar topic and writing focus';
    }
    return reason;
  };

  return (
    <div>
      <h3>Similar Books</h3>
      <p className="muted">Recommendations based on genre, tags, and semantic similarity.</p>
      <div className="grid">
        {items.length === 0 ? <span className="muted">No similar recommendations yet.</span> : null}
        {items.map((item) => (
          <div key={item.id} className="card">
            <strong>{item.title ?? item.code ?? item.id}</strong>
            {item.code ? <span className="muted">{item.code}</span> : null}
            <span className="muted">Why: {describeReason(item.reason)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

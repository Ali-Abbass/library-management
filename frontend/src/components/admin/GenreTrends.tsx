import { useEffect, useState } from 'react';
import { fetchGenreTrends } from '../../services/ai.api';

type Trend = { genre: string; score: number; insight?: string };

export default function GenreTrends() {
  const [trends, setTrends] = useState<Trend[]>([]);

  useEffect(() => {
    fetchGenreTrends().then(setTrends).catch(() => setTrends([]));
  }, []);

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <div>
          <h2>Genre Trends</h2>
          <p className="muted">Predicted popular genres based on borrowing.</p>
        </div>
        <span className="pill">{trends.length} trends</span>
      </div>
      <div className="grid grid-2">
        {trends.map((trend) => (
          <div key={trend.genre} className="card">
            <span className="tag">Genre</span>
            <strong>{trend.genre}</strong>
            <span className="muted">Score {trend.score}</span>
            {trend.insight ? <span className="muted">{trend.insight}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { fetchReadingTime } from '../../services/ai.api';

type ReadingTimeProps = {
  bookId: string;
};

export default function ReadingTime({ bookId }: ReadingTimeProps) {
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    fetchReadingTime(bookId)
      .then((res) => setMinutes(res?.minutes ?? null))
      .catch(() => setMinutes(null));
  }, [bookId]);

  if (minutes === null) {
    return <div className="muted">Reading estimate unavailable for this book.</div>;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const friendlyDuration = hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;

  return (
    <div>
      <h3>Estimated Reading Time</h3>
      <div>{friendlyDuration}</div>
      <div className="muted">Based on page count and an average steady reading pace.</div>
    </div>
  );
}

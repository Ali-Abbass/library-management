import { useEffect, useState } from 'react';
import { listAlerts } from '../../services/alerts.api';

export default function AlertBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    listAlerts().then((alerts) => setCount(alerts.length)).catch(() => setCount(0));
  }, []);

  return (
    <div className="pill">Alerts {count}</div>
  );
}

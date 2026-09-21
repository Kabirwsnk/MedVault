import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

type ConnectionState = 'checking' | 'online' | 'offline' | 'server-unavailable';

export const ConnectionStatus: React.FC = () => {
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine);
  const [state, setState] = useState<ConnectionState>('checking');

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => {
      setBrowserOnline(false);
      setState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkHealth = async () => {
      if (!navigator.onLine) {
        setState('offline');
        return;
      }

      try {
        await api.health();
        setState('online');
      } catch {
        setState('server-unavailable');
      }
    };

    checkHealth();
    const interval = window.setInterval(checkHealth, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearInterval(interval);
    };
  }, []);

  const displayState = !browserOnline ? 'offline' : state;
  const label = {
    checking: 'Checking connection',
    online: 'Connected',
    offline: 'Offline',
    'server-unavailable': 'Server unavailable',
  }[displayState];
  const color = displayState === 'online' ? 'var(--accent-secondary)' : displayState === 'checking' ? 'var(--accent-warning)' : 'var(--accent-danger)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }} role="status" aria-live="polite">
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
      <span>{label}</span>
    </div>
  );
};

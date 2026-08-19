import { useEffect, useState } from 'react';

type HealthStatus = 'loading' | 'ok' | 'error';

function App() {
  const [status, setStatus] = useState<HealthStatus>('loading');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/health`);
        if (!res.ok) throw new Error(`backend returned ${res.status}`);
        const data = await res.json();
        setStatus(data.status === 'ok' ? 'ok' : 'error');
      } catch {
        setStatus('error');
      }
    };

    checkHealth();
  }, []);

  return (
    <div>
      <h1>Hello World</h1>
      <p>
        Backend: {status === 'loading' && 'sprawdzam...'}
        {status === 'ok' && '✅ połączono'}
        {status === 'error' && '❌ brak połączenia'}
      </p>
    </div>
  );
}

export default App;

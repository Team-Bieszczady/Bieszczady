import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import './index.css';
import App from './App.tsx';
import { queryClient } from './lib/queryClient';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <TanStackDevtools
        plugins={[{ name: 'TanStack Query', render: <ReactQueryDevtoolsPanel /> }]}
      />
    </QueryClientProvider>
  </StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// ENTERPRISE PERF FIX: Configure QueryClient to aggressively cache and prevent layout thrashing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // Data stays fresh for 30 minutes! No unnecessary API calls.
      gcTime: 1000 * 60 * 60, // Keep in garbage collection for 1 hour
      refetchOnWindowFocus: false, // Stops the massive stutter when switching browser tabs
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);
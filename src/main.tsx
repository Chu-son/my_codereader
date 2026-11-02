import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from '@/app/App';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="アプリ">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

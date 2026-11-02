import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from '@/app/App';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { STRINGS } from '@/shared/constants/strings';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label={STRINGS.app.boundaryApp}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

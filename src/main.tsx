import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Landing page (`/`) is fully static HTML with its own SEO content. The React
// typing coach only hydrates on `/app` (and its query variants) so React never
// wipes the crawlable landing copy.
const isAppPath = window.location.pathname === '/app' || window.location.pathname.startsWith('/app/');

if (isAppPath) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Register the service worker only in production builds (avoids dev/HMR interference)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

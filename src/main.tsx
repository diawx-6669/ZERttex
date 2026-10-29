import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './state';
import { ChatProvider } from './components/Chat';
import './index.css';
import { takeKeyFromUrl } from './lib/ai';

takeKeyFromUrl();

// Offline support (sw.js): only on the real https site, never in tests or file://.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </AppProvider>
  </React.StrictMode>,
);

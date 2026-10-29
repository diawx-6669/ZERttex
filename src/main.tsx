import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './state';
import { ChatProvider } from './components/Chat';
import './index.css';
import { takeKeyFromUrl } from './lib/ai';

takeKeyFromUrl();

// Motion layer (index.css): on for people who did not ask for reduced motion; off under automation.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.webdriver) document.documentElement.classList.add('motion');

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

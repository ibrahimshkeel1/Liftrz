import {StrictMode, Component, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface EBProps {
  children: ReactNode;
}

interface EBState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = {hasError: false, error: null};
  static getDerivedStateFromError(error: Error): EBState {
    return {hasError: true, error};
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('React ErrorBoundary caught:', error, errorInfo);
    const errorDiv = document.getElementById('error-display');
    if (errorDiv) {
      errorDiv.style.display = 'block';
      errorDiv.innerHTML = '<h2 style="color:#F97316; margin-bottom:12px;">React Render Error</h2><pre style="white-space:pre-wrap; word-break:break-word; color:#fca5a5; font-size:13px;">' + error.message + '\n\n' + (error.stack || '') + '\n\n' + JSON.stringify(errorInfo, null, 2) + '</pre>';
    }
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    // @ts-expect-error React 19 types omit props accessor on Component in some configs
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Register service worker for PWA + auto-reload on update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Auto-reload when a new service worker is waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                window.location.reload();
              }
            });
          }
        });
      })
      .catch(() => {
        // Silently fail SW registration — app works without it
      });
  });
}

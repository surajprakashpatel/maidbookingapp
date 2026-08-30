'use client';

import { AuthProvider } from '@/lib/auth-context';
import { AppProvider, useApp } from '@/lib/app-context';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

// ============================================================
// SERVICE WORKER REGISTRATION
// ============================================================

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed — non-critical
      });
    }
  }, []);
  return null;
}

// ============================================================
// TOAST PROVIDER
// ============================================================

function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle size={18} style={{ color: 'var(--success-500)', flexShrink: 0 }} />,
    error:   <AlertCircle size={18} style={{ color: 'var(--error-500)', flexShrink: 0 }} />,
    warning: <AlertTriangle size={18} style={{ color: 'var(--accent-500)', flexShrink: 0 }} />,
    info:    <Info size={18} style={{ color: 'var(--info-500)', flexShrink: 0 }} />,
  };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {icons[t.type]}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{t.title}</div>
            {t.message && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.message}</div>}
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', flexShrink: 0 }}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// INNER PROVIDERS (can access AppContext)
// ============================================================

function InnerProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegistrar />
      <ToastContainer />
      {children}
    </>
  );
}

// ============================================================
// ROOT PROVIDERS
// ============================================================

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>
        <InnerProviders>
          {children}
        </InnerProviders>
      </AppProvider>
    </AuthProvider>
  );
}

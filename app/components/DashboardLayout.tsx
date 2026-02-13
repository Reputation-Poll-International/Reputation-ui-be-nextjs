'use client';

import { ReactNode, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Header from './Header';
import Sidebar from './Sidebar';
import { isAuthenticated } from '@/lib/auth';

interface DashboardLayoutProps {
  children: ReactNode;
}

function subscribeAuthStore(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('storage', onStoreChange);
  window.addEventListener('focus', onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener('focus', onStoreChange);
  };
}

function getAuthSnapshot(): boolean {
  return isAuthenticated();
}

function getAuthServerSnapshot(): null {
  return null;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const isAuthed = useSyncExternalStore(
    subscribeAuthStore,
    getAuthSnapshot,
    getAuthServerSnapshot
  );

  useEffect(() => {
    if (isAuthed === false) {
      router.replace('/login');
    }
  }, [isAuthed, router]);

  if (isAuthed !== true) {
    return null;
  }

  return (
    <div className="page">
      <Script src="/js/defaultmenu.min.js" strategy="afterInteractive" />
      <Header />
      <Sidebar />
      <div className="main-content app-content">
        <div className="container-fluid page-container">
          <div className="ai-presence-banner card custom-card mb-4">
            <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
              <div>
                <span className="badge bg-primary me-2">AI Engine Active</span>
                <span className="text-muted">
                  Audits, scoring, sentiment analysis, and recommendations are powered by AI.
                </span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-primary-transparent text-primary">AI Audit</span>
                <span className="badge bg-success-transparent text-success">AI Insights</span>
                <span className="badge bg-info-transparent text-info">AI Recommendations</span>
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

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
          {children}
        </div>
      </div>
    </div>
  );
}

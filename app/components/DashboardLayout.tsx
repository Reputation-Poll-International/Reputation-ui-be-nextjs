'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Header from './Header';
import Sidebar from './Sidebar';
import { isAuthenticated } from '@/lib/auth';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const isAuthed = isAuthenticated();

  useEffect(() => {
    if (!isAuthed) {
      router.replace('/login');
    }
  }, [isAuthed, router]);

  if (!isAuthed) {
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

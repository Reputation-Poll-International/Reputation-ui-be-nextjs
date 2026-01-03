'use client';

import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="page">
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

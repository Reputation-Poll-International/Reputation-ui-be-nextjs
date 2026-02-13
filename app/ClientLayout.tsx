'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { initPushNotifications } from '@/lib/pushNotifications';

export default function ClientLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  useEffect(() => {
    // Initialize push notifications
    initPushNotifications();
  }, []);

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

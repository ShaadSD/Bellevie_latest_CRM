'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/app/login/page';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'HQ') {
      router.push('/hq');
    } else if (user?.role === 'NC') {
      router.push('/nc');
    }
  }, [user, router]);

  if (!user) {
    return <LoginPage />;
  }

  return null;
}

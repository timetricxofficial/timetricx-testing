'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Loading from '../../components/ui/Loading';

export default function UsersPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to dashboard
    router.push('/users/dashboard');
  }, []);

  return <Loading fullPage />;
}
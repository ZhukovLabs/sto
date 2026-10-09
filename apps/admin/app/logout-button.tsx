'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@sto/ui';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout(): Promise<void> {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" loading={loading} onClick={onLogout}>
      Выйти
    </Button>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Checkbox, Input } from '@sto/ui';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (loading) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, remember }),
      });
      if (response.ok) {
        router.replace('/');
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? 'Не удалось войти, попробуйте ещё раз');
    } catch {
      setError('Сервис авторизации недоступен');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="admin@promaks.by"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        label="Пароль"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={error ?? undefined}
      />
      <Checkbox
        checked={remember}
        onChange={setRemember}
        label="Запомнить меня"
        className="mt-0.5 self-start"
      />
      <Button type="submit" loading={loading} className="mt-1.5">
        Войти
      </Button>
    </form>
  );
}

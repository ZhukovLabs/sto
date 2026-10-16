'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SmartCaptcha } from '@yandex/smart-captcha';
import { Button, Checkbox, Input } from '@sto/ui';

const SITE_KEY = process.env.NEXT_PUBLIC_SMARTCAPTCHA_SITEKEY ?? '';
const captchaEnabled = SITE_KEY !== '';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Сброс капчи — ремоунт виджета по ключу (токен одноразовый).
  const [captchaKey, setCaptchaKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function resetCaptcha(): void {
    setCaptchaToken(null);
    setCaptchaKey((key) => key + 1);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (loading) {
      return;
    }
    if (captchaEnabled && captchaToken === null) {
      setError('Подтвердите, что вы не робот');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          remember,
          ...(captchaToken !== null ? { captchaToken } : {}),
        }),
      });
      if (response.ok) {
        router.replace('/');
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? 'Не удалось войти, попробуйте ещё раз');
      resetCaptcha();
    } catch {
      setError('Сервис авторизации недоступен');
      resetCaptcha();
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
      {captchaEnabled ? (
        <SmartCaptcha
          key={captchaKey}
          sitekey={SITE_KEY}
          onSuccess={(token: string) => setCaptchaToken(token)}
        />
      ) : null}
      <Checkbox
        checked={remember}
        onChange={setRemember}
        label="Запомнить меня"
        className="mt-0.5 self-start"
      />
      <Button
        type="submit"
        loading={loading}
        disabled={captchaEnabled && captchaToken === null}
        className="mt-1.5"
      >
        Войти
      </Button>
    </form>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  Bell,
  CalendarClock,
  Inbox,
  LayoutGrid,
  LogOut,
  Menu,
  Send,
  Users,
  Wrench,
} from 'lucide-react';
import { Modal } from '@sto/ui';
import { LogoMark } from '@/shared/brand/LogoMark';
import type { AdminUser } from '@/lib/auth';

interface AppShellProps {
  user: AdminUser;
  badge: number | null;
  children: ReactNode;
}

const NAV = [
  { href: '/', label: 'Дашборд', crumb: 'дашборд', icon: LayoutGrid },
  { href: '/requests', label: 'Обращения', crumb: 'обращения', icon: Inbox, badge: true },
  { href: '/services', label: 'Услуги', crumb: 'услуги · каталог', icon: Wrench },
  { href: '/booking-settings', label: 'Запись', crumb: 'настройки записи', icon: CalendarClock },
  { href: '/notifications', label: 'Уведомления', crumb: 'уведомления', icon: Bell },
  { href: '/team', label: 'Команда', crumb: 'команда', icon: Users },
  { href: '/masters', label: 'Мастера', crumb: 'мастера · telegram', icon: Send },
] as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter((ch) => ch !== undefined)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function AppShell({ user, badge, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const activeIndex = NAV.findIndex((item) => isActive(pathname, item.href));
  const [bar, setBar] = useState<{ top: number; height: number } | null>(null);

  const syncBar = () => {
    const el = activeIndex >= 0 ? linkRefs.current[activeIndex] : null;
    if (el) {
      setBar({ top: el.offsetTop, height: el.offsetHeight });
    } else {
      setBar(null);
    }
  };

  useLayoutEffect(syncBar, [activeIndex, badge]);

  useEffect(() => {
    const nav = navRef.current;
    if (nav === null) return;
    const observer = new ResizeObserver(syncBar);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [activeIndex, badge]);

  async function onLogout(): Promise<void> {
    setLoggingOut(true);
    setLogoutError(false);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok && response.status !== 401) {
        throw new Error(`logout failed: ${response.status}`);
      }
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('Не удалось выйти из панели:', error);
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-r border-border bg-panel px-3.5 py-5 lg:flex">
        <Link
          href="/"
          className="mb-6 flex h-11 items-center gap-3 px-2.5 font-display text-h5 font-bold uppercase tracking-[0.04em] text-content"
        >
          <LogoMark className="size-8 shrink-0" />
          <span className="hidden min-w-0 truncate lg:inline">
            Про<span className="text-primary">Макс</span>
            <span className="block font-mono text-micro font-normal normal-case tracking-[0.14em] text-content-dim">
              панель · цех
            </span>
          </span>
        </Link>

        <nav
          ref={navRef}
          aria-label="Разделы панели"
          className="relative flex flex-1 flex-col gap-1"
        >
          {bar !== null ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 rounded-xl bg-panel-2 shadow-[inset_2px_0_0_0_var(--color-primary)] transition-transform duration-[420ms] [transition-timing-function:cubic-bezier(0.22,1.15,0.36,1)] motion-reduce:transition-none"
              style={{ height: bar.height, transform: `translateY(${bar.top}px)` }}
            />
          ) : null}
          {NAV.map((item, index) => {
            const active = index === activeIndex;
            const showBadge = 'badge' in item && item.badge && badge !== null && badge > 0;
            return (
              <Link
                key={item.href}
                ref={(el) => {
                  linkRefs.current[index] = el;
                }}
                href={item.href}
                title={item.label}
                aria-current={active ? 'page' : undefined}
                className={`group relative z-10 flex h-11 items-center gap-3 rounded-xl px-2.5 text-body-sm transition-colors duration-300 ${
                  active
                    ? 'text-content'
                    : 'text-content-muted hover:bg-panel-2/60 hover:text-content'
                }`}
              >
                <item.icon
                  size={18}
                  strokeWidth={1.8}
                  className={`shrink-0 transition-colors duration-300 ${
                    active ? 'text-primary' : 'group-hover:text-content'
                  }`}
                />
                <span className="hidden min-w-0 truncate lg:inline">{item.label}</span>
                {showBadge ? (
                  <span className="ml-auto hidden size-5 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-micro font-bold text-primary-ink lg:flex">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          title={logoutError ? 'Не удалось выйти — попробуйте ещё раз' : undefined}
          className={`flex h-11 items-center gap-3 rounded-xl px-2.5 text-body-sm transition-colors disabled:opacity-50 ${
            logoutError
              ? 'text-danger hover:bg-panel-2'
              : 'text-content-dim hover:bg-panel-2 hover:text-danger'
          }`}
        >
          <LogOut size={18} strokeWidth={1.8} className="shrink-0" />
          <span className="hidden lg:inline">
            {loggingOut ? 'Выходим…' : logoutError ? 'Не вышло — ещё раз' : 'Выйти'}
          </span>
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-bg/95 px-4 backdrop-blur-md sm:px-8">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Открыть меню разделов"
            className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-md text-content-muted transition-colors hover:bg-panel hover:text-content motion-reduce:transition-none lg:hidden"
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>
          <span className="min-w-0 truncate font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
            {NAV[activeIndex]?.crumb ?? 'панель'}
          </span>
          <span className="ml-auto flex min-w-0 items-center gap-3">
            <span className="hidden max-w-[220px] truncate font-mono text-caption text-content-dim sm:inline">
              {user.email}
            </span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-mono text-caption font-bold text-primary-ink">
              {initials(user.name) || 'A'}
            </span>
          </span>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <Modal open={navOpen} onClose={() => setNavOpen(false)} title="Разделы" size="sm">
        <nav aria-label="Разделы панели" className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const showBadge = 'badge' in item && item.badge && badge !== null && badge > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setNavOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-body-sm transition-colors duration-300 ${
                  active
                    ? 'bg-panel-2 text-content shadow-[inset_2px_0_0_0_var(--color-primary)]'
                    : 'text-content-muted hover:bg-panel-2 hover:text-content'
                }`}
              >
                <item.icon
                  size={18}
                  strokeWidth={1.8}
                  className={`shrink-0 ${active ? 'text-primary' : ''}`}
                />
                <span className="min-w-0 truncate">{item.label}</span>
                {showBadge ? (
                  <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-micro font-bold text-primary-ink">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => {
              setNavOpen(false);
              void onLogout();
            }}
            disabled={loggingOut}
            className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-body-sm transition-colors disabled:opacity-50 ${
              logoutError
                ? 'text-danger hover:bg-panel-2'
                : 'text-content-dim hover:bg-panel-2 hover:text-danger'
            }`}
          >
            <LogOut size={18} strokeWidth={1.8} className="shrink-0" />
            {loggingOut ? 'Выходим…' : logoutError ? 'Не вышло — ещё раз' : 'Выйти'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

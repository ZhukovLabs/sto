'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, Menu, Phone, X } from 'lucide-react';
import { Button, Container, Modal } from '@/shared/ui';
import { CallbackButton, CallbackRequestDialog } from '@/features/callback-request';
import { site } from '@/shared/config/site';
import { LogoMark } from '@/shared/brand/LogoMark';

const NAV_ITEMS = [
  { href: '/services', label: 'Услуги и цены', match: (p: string) => p.startsWith('/services') },
  { href: '/#how', label: 'Как работаем', match: () => false },
  { href: '/#trust', label: 'Гарантия', match: () => false },
  { href: '/contacts', label: 'Контакты', match: (p: string) => p === '/contacts' },
] as const;

export function Header() {
  const phone = site.phones[0];
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const transparent = !scrolled;

  return (
    <header
      className={`sticky top-0 z-(--z-header) border-b transition-colors duration-200 ${
        transparent
          ? 'border-transparent bg-transparent'
          : 'border-border bg-bg/95 backdrop-blur-md'
      }`}
    >
      <Container size="site">
        <div className="relative grid h-14 grid-cols-[auto_1fr_auto] items-center gap-6 sm:h-16 sm:gap-8">
          <Link
            href="/"
            className="flex items-center justify-self-start gap-3"
            aria-label={`${site.name} — на главную`}
          >
            <LogoMark className="size-11 shrink-0" />
            <span className="font-display text-h4 font-bold uppercase tracking-[0.06em] text-content">
              ПроМакс
            </span>
          </Link>

          <nav
            aria-label="Основная навигация"
            className="hidden min-w-0 flex-1 justify-center lg:flex"
          >
            <ul className="flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.match(pathname) ? 'page' : undefined}
                    className={`relative py-1 text-center text-body font-medium transition-colors hover:text-content ${
                      item.match(pathname) ? 'text-content' : 'text-content-muted'
                    }`}
                  >
                    {item.label}
                    {item.match(pathname) ? (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary"
                      />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center justify-self-end gap-4 sm:gap-8">
            <a href={`tel:${phone.value}`} className="hidden flex-col items-end gap-0.5 md:flex">
              <span className="font-mono text-body-lg font-semibold text-content">
                {phone.pretty}
              </span>
              <span className="font-mono text-caption text-content-dim">{site.hours.label}</span>
            </a>
            <a
              href={`tel:${phone.value}`}
              aria-label={`Позвонить: ${phone.pretty}`}
              className="flex size-10 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-panel hover:text-content md:hidden"
            >
              <Phone aria-hidden="true" className="size-5" strokeWidth={2} />
            </a>
            <div className="hidden sm:block">
              <CallbackButton size="md" pill>
                Записаться
              </CallbackButton>
            </div>
            <button
              type="button"
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex size-10 items-center justify-center rounded-full border border-border text-content transition-colors hover:border-border-strong active:translate-y-px lg:hidden"
            >
              {menuOpen ? (
                <X aria-hidden="true" className="size-4.5" strokeWidth={2} />
              ) : (
                <Menu aria-hidden="true" className="size-4.5" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </Container>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Меню" size="sm">
        <nav aria-label="Мобильная навигация">
          <ul className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="border-b border-border last:border-b-0">
                <Link
                  href={item.href}
                  aria-current={item.match(pathname) ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between py-4 text-body-lg transition-colors ${
                    item.match(pathname) ? 'text-content' : 'text-content-muted hover:text-content'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <a href={`tel:${phone.value}`} className="mt-6 flex flex-col gap-1 rounded-lg bg-panel p-4">
          <span className="font-mono text-body-lg font-semibold text-content">{phone.pretty}</span>
          <span className="font-mono text-caption text-content-dim">
            {site.hours.label} · {site.hours.note}
          </span>
        </a>
        <div className="mt-4">
          <Button
            size="lg"
            fullWidth
            leftIcon={<CalendarCheck aria-hidden="true" className="size-4.5" strokeWidth={2} />}
            onClick={() => {
              setMenuOpen(false);
              setBookingOpen(true);
            }}
          >
            Записаться
          </Button>
        </div>
      </Modal>

      <CallbackRequestDialog open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </header>
  );
}

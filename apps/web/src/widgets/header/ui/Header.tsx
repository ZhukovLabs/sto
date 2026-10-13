'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, Menu, Phone, X } from 'lucide-react';
import { Button, Container, Modal } from '@/shared/ui';
import { CallbackButton, CallbackRequestDialog } from '@/features/callback-request';
import { useSiteInfo } from '@/entities/site';
import { site } from '@/shared/config/site';
import { LogoMark } from '@/shared/brand/LogoMark';

const NAV_ITEMS = [
  {
    href: '/services',
    label: 'Услуги и цены',
    match: (p: string) => p.startsWith('/services'),
    section: 'services',
  },
  { href: '/#trust', label: 'Гарантия', match: () => false, section: 'trust' },
  {
    href: '/news',
    label: 'Новости',
    match: (p: string) => p.startsWith('/news'),
    section: 'news',
  },
  {
    href: '/contacts',
    label: 'Контакты',
    match: (p: string) => p === '/contacts',
    section: 'contacts',
  },
] as const;

type NavItem = (typeof NAV_ITEMS)[number];

/** Якорные пункты («/#…») скроллим через JS: повторный клик снова прокручивает к секции. */
const isAnchorItem = (item: NavItem): boolean => item.href.startsWith('/#');

export function Header() {
  const { phone, hours } = useSiteInfo();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Scroll-spy: подсвечивает якорные пункты («Как работаем», «Гарантия» и др.),
  // когда соответствующая секция попадает в верхнюю треть экрана.
  useEffect(() => {
    setActiveSection(null);
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.section)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) {
      return;
    }
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }
        const current = sections.find((el) => visible.has(el.id));
        setActiveSection(current === undefined ? null : current.id);
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    for (const el of sections) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, [pathname]);

  const isActive = (item: NavItem): boolean =>
    item.match(pathname) || (activeSection !== null && item.section === activeSection);

  const scrollToSection =
    (item: NavItem) =>
    (event: MouseEvent<HTMLAnchorElement>): void => {
      if (pathname !== '/') {
        return; // с другой страницы — обычная навигация на главную с hash
      }
      const target = document.getElementById(item.section);
      if (target === null) {
        return;
      }
      event.preventDefault();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      window.history.replaceState(null, '', item.href);
    };
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const transparent = !scrolled;

  return (
    <header
      className={`sticky top-0 z-(--z-header) border-b transition-colors duration-150 ${
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
                    onClick={isAnchorItem(item) ? scrollToSection(item) : undefined}
                    aria-current={
                      isActive(item) ? (item.match(pathname) ? 'page' : 'true') : undefined
                    }
                    className={`relative py-1 text-center text-body font-medium transition-colors hover:text-content ${
                      isActive(item) ? 'text-content' : 'text-content-muted'
                    }`}
                  >
                    {item.label}
                    {isActive(item) ? (
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

          <div className="col-start-3 flex shrink-0 items-center justify-self-end gap-4 sm:gap-8">
            <a href={`tel:${phone.value}`} className="hidden flex-col items-end gap-0.5 md:flex">
              <span className="font-mono text-body-lg font-semibold text-content">
                {phone.pretty}
              </span>
              <span className="font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
                {hours.label}
              </span>
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
                  aria-current={
                    isActive(item) ? (item.match(pathname) ? 'page' : 'true') : undefined
                  }
                  onClick={(event) => {
                    setMenuOpen(false);
                    if (isAnchorItem(item)) {
                      scrollToSection(item)(event);
                    }
                  }}
                  className={`flex items-center justify-between py-4 text-body-lg transition-colors ${
                    isActive(item) ? 'text-content' : 'text-content-muted hover:text-content'
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
            {hours.label} · {hours.note}
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

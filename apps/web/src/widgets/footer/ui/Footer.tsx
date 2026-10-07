import { Wrench } from 'lucide-react';
import { site } from '@/shared/config/site';
import { Container, Text } from '@/shared/ui';

export function Footer() {
  const phone = site.phones[0];

  return (
    <footer className="border-t border-border">
      <Container size="site">
        <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="/"
            className="flex items-center gap-2.5"
            aria-label={`${site.name} — на главную`}
          >
            <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Wrench aria-hidden="true" className="size-3.5 text-primary-ink" strokeWidth={2} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-display text-body font-bold uppercase tracking-[0.04em] text-content">
                ПроМакс
              </span>
              <Text variant="micro" className="font-mono text-content-dim">
                автосервис · {site.city}
              </Text>
            </span>
          </a>

          <div className="flex items-center gap-5">
            <a
              href={`tel:${phone.value}`}
              className="font-mono text-mono text-content-muted transition-colors hover:text-content"
            >
              {phone.pretty}
            </a>
            <Text variant="micro" className="font-mono text-content-dim">
              {site.hours.label}
            </Text>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border py-5 sm:flex-row sm:items-center sm:justify-between">
          <Text variant="micro" className="font-mono text-content-dim">
            © 2026 {site.name} · УНП {site.unp}
          </Text>
          <a
            href="/privacy"
            className="font-mono text-micro text-content-dim transition-colors hover:text-content"
          >
            Политика персональных данных
          </a>
        </div>
      </Container>
    </footer>
  );
}

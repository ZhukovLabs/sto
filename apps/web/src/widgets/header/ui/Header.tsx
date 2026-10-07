import { Phone, Wrench } from 'lucide-react';
import { Container, Text } from '@/shared/ui';
import { CallbackButton } from '@/features/callback-request';
import { site } from '@/shared/config/site';

export function Header() {
  const phone = site.phones[0];

  return (
    <header className="sticky top-0 z-(--z-header) bg-bg">
      <Container size="site">
        <div className="flex h-14 items-center justify-between sm:h-16">
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

          <div className="flex shrink-0 items-center gap-3 sm:gap-5 md:gap-7">
            <a
              href={`tel:${phone.value}`}
              className="hidden font-mono text-mono text-content-muted transition-colors hover:text-content md:block"
            >
              {phone.pretty}
            </a>
            <a
              href={`tel:${phone.value}`}
              aria-label={`Позвонить: ${phone.pretty}`}
              className="flex size-10 items-center justify-center rounded-full border border-border text-content transition-colors hover:border-border-strong active:translate-y-px md:hidden"
            >
              <Phone aria-hidden="true" className="size-4.5" strokeWidth={2} />
            </a>
            <div className="hidden sm:block">
              <CallbackButton size="sm" pill>
                Записаться
              </CallbackButton>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}

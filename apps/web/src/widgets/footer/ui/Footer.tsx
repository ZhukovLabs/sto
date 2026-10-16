import { site } from '@/shared/config/site';
import { getSiteInfo, mapsRouteHref } from '@/entities/site';
import { LogoMark } from '@/shared/brand/LogoMark';
import { Container, Text } from '@/shared/ui';

export async function Footer() {
  const { phone, hours, address, unp, coords } = await getSiteInfo();

  return (
    <footer className="border-t border-border">
      <Container size="site">
        <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <a
              href="/"
              className="flex items-center gap-2.5"
              aria-label={`${site.name} — на главную`}
            >
              <LogoMark className="size-8.5 shrink-0" />
              <span className="flex min-w-0 flex-col">
                <span className="font-display text-body font-bold uppercase tracking-[0.04em] text-content">
                  ПроМакс
                </span>
                <Text variant="micro" className="font-mono text-content-dim">
                  автосервис · {site.city}
                </Text>
              </span>
            </a>
            <a
              href={address.isSet ? mapsRouteHref(address.value, coords) : '/contacts'}
              {...(address.isSet
                ? { target: '_blank', rel: 'noopener noreferrer', title: 'Построить маршрут' }
                : {})}
              aria-label={address.isSet ? `Маршрут до ${address.value}` : 'Контакты'}
              className="flex w-fit items-center gap-1.5 pl-11 font-mono text-micro text-content-dim transition-colors hover:text-primary"
            >
              {address.value}
            </a>
          </div>

          <div className="flex items-center gap-5">
            <a
              href={`tel:${phone.value}`}
              className="font-mono text-mono text-content-muted transition-colors hover:text-content"
            >
              {phone.pretty}
            </a>
            <Text variant="micro" className="font-mono text-content-dim">
              {hours.label}
            </Text>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border py-5 sm:flex-row sm:items-center sm:justify-between">
          <Text variant="micro" className="font-mono text-content-dim">
            © {new Date().getFullYear()} {site.name}
            {unp !== '' ? ` · УНП ${unp}` : ''}
          </Text>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            <a
              href="/news"
              className="font-mono text-micro text-content-dim transition-colors hover:text-content"
            >
              Новости
            </a>
            <a
              href="/faq"
              className="font-mono text-micro text-content-dim transition-colors hover:text-content"
            >
              Вопросы и ответы
            </a>
            <a
              href="/privacy"
              className="font-mono text-micro text-content-dim transition-colors hover:text-content"
            >
              Политика персональных данных
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

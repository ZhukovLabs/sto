import { Button, Container, Heading, Text } from '@/shared/ui';
import { site } from '@/shared/config/site';

export default function NotFound() {
  return (
    <section className="border-b border-border">
      <Container size="site" className="pb-24 pt-16">
        <Heading variant="display-sm" font="display" as="h1" className="uppercase">
          Страница не найдена
        </Heading>
        <Text variant="lead" color="muted" className="mt-5 max-w-[640px]">
          Такой страницы нет — возможно, её переместили или ссылка устарела. Начните с главной или
          загляните в новости и услуги.
        </Text>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" href="/">
            На главную
          </Button>
          <Button size="lg" variant="outline" href="/news">
            Новости
          </Button>
          <Button size="lg" variant="outline" href="/services">
            Услуги
          </Button>
        </div>
        <Text variant="caption" color="dim" className="mt-10 font-mono">
          {site.name} · {site.city}
        </Text>
      </Container>
    </section>
  );
}

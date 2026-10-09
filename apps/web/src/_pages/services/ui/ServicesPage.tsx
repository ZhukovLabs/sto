import { Container, Heading, Text } from '@/shared/ui';
import { getServiceCatalog } from '@/entities/service';
import { ServicesCatalogSection } from '../ui/ServicesCatalogSection';

export function ServicesPage() {
  return (
    <>
      <section className="border-b border-border">
        <Container size="site" className="pb-10 pt-12 sm:pt-16">
          <Heading variant="display-lg" font="display" as="h1" className="uppercase">
            Услуги и цены
          </Heading>
          <Text variant="body-lg" color="muted" className="mt-4 max-w-[640px]">
            Полный прейскурант по всем направлениям — от замены масла до ремонта кондиционера.
            Выбирайте услугу и записывайтесь онлайн.
          </Text>
        </Container>
      </section>
      <Container size="site" className="pb-24 pt-8">
        <ServicesCatalogAsync />
      </Container>
    </>
  );
}

async function ServicesCatalogAsync() {
  const catalog = await getServiceCatalog();
  if (catalog === null) {
    return (
      <Text color="muted" className="py-16 text-center">
        Каталог временно недоступен — обновите страницу чуть позже или позвоните нам.
      </Text>
    );
  }
  return <ServicesCatalogSection catalog={catalog.groups} />;
}

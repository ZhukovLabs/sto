import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServiceCatalog } from '@/entities/service';
import { ServicesServicePage } from '@/_pages/services-service';

interface ServicePageProps {
  params: Promise<{ group: string; service: string }>;
}

export async function generateStaticParams() {
  const catalog = await getServiceCatalog();
  const paths: { group: string; service: string }[] = [];
  for (const group of catalog?.groups ?? []) {
    for (const service of group.services) {
      paths.push({ group: group.id, service: service.id });
    }
  }
  return paths;
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { group: groupId, service: serviceId } = await params;
  const catalog = await getServiceCatalog();
  const group = catalog?.groups.find((item) => item.id === groupId);
  const service = group?.services.find((item) => item.id === serviceId);
  if (group === undefined || service === undefined) {
    return { title: 'Услуги и цены — СТО «ПроМакс»' };
  }
  const summary = service.details ?? service.description;
  return {
    title: `${service.title} — от ${service.priceFrom} Б в Гомеле | СТО «ПроМакс»`,
    description:
      summary !== ''
        ? `${summary.slice(0, 150)}… Цена от ${service.priceFrom} Б, запись онлайн.`
        : `${service.title} в автосервисе «ПроМакс», Гомель. Цена от ${service.priceFrom} Б, запись онлайн, гарантия 6 месяцев.`,
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { group: groupId, service: serviceId } = await params;
  const catalog = await getServiceCatalog();
  const group = catalog?.groups.find((item) => item.id === groupId);
  const service = group?.services.find((item) => item.id === serviceId);
  if (group === undefined || service === undefined) {
    notFound();
  }
  return <ServicesServicePage group={group} service={service} />;
}

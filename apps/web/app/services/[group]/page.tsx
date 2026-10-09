import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServiceCatalog } from '@/entities/service';
import { ServicesGroupPage } from '@/_pages/services-group';

interface GroupPageProps {
  params: Promise<{ group: string }>;
}

export async function generateStaticParams() {
  const catalog = await getServiceCatalog();
  return (catalog?.groups ?? []).map((group) => ({ group: group.id }));
}

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  const { group: groupId } = await params;
  const catalog = await getServiceCatalog();
  const group = catalog?.groups.find((item) => item.id === groupId);
  if (group === undefined) {
    return { title: 'Услуги и цены — СТО «ПроМакс»' };
  }
  const activeServices = group.services.filter((service) => service.isActive);
  const priceFrom =
    activeServices.length > 0
      ? Math.min(...activeServices.map((service) => service.priceFrom))
      : null;
  const base = `${group.title} в автосервисе «ПроМакс», Гомель`;
  return {
    title:
      priceFrom !== null
        ? `${group.title} в Гомеле — от ${priceFrom} Б | СТО «ПроМакс»`
        : `${group.title} в Гомеле | СТО «ПроМакс»`,
    description:
      priceFrom !== null
        ? `${base}: ${activeServices.map((service) => service.title).join(', ')}. Цена от ${priceFrom} Б, запись онлайн, гарантия 6 месяцев.`
        : `${base}. Запись онлайн, гарантия 6 месяцев.`,
  };
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { group: groupId } = await params;
  const catalog = await getServiceCatalog();
  const group = catalog?.groups.find((item) => item.id === groupId);
  if (group === undefined) {
    notFound();
  }
  return <ServicesGroupPage group={group} />;
}

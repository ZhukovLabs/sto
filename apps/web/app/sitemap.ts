import type { MetadataRoute } from 'next';
import { getServiceCatalog } from '@/entities/service';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promaks.by';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/services`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/contacts`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
  ];

  const catalog = await getServiceCatalog();
  const groupEntries: MetadataRoute.Sitemap = (catalog?.groups ?? []).map((group) => ({
    url: `${BASE_URL}/services/${group.id}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
  const serviceEntries: MetadataRoute.Sitemap = (catalog?.groups ?? []).flatMap((group) =>
    group.services
      .filter((service) => service.isActive)
      .map((service) => ({
        url: `${BASE_URL}/services/${group.id}/${service.id}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
  );

  return [...staticEntries, ...groupEntries, ...serviceEntries];
}

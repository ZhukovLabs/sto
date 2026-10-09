import type { Metadata } from 'next';
import { site } from '@/shared/config/site';
import { ContactsPage } from '@/_pages/contacts';

export const metadata: Metadata = {
  title: `Контакты — ${site.name}, ${site.city}: адрес и телефоны`,
  description: `Адрес и телефоны автосервиса ${site.name} в ${site.city}: ${site.address}. ${site.hours.label}, ${site.hours.note}. Запись онлайн и по телефону.`,
};

export { ContactsPage as default };

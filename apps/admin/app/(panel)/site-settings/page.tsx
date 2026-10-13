import { redirect } from 'next/navigation';

/** Контакты сайта переехали в раздел «Настройки», вкладка «Сайт». */
export default function SiteSettingsRedirect() {
  redirect('/settings?tab=site');
}

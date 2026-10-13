import { redirect } from 'next/navigation';

/** Уведомления переехали в раздел «Настройки». */
export default function NotificationsRedirect() {
  redirect('/settings?tab=notifications');
}

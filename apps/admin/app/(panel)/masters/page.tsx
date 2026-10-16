import { redirect } from 'next/navigation';

/** Мастера переехали в раздел «Команда», вкладка Telegram. */
export default function MastersRedirect() {
  redirect('/team?tab=telegram');
}

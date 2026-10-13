import { redirect } from 'next/navigation';

/** Настройки записи переехали в раздел «Настройки». */
export default function BookingSettingsRedirect() {
  redirect('/settings?tab=booking');
}

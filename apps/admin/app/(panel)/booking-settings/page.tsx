import { Heading } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { BookingSettingsForm } from '@/features/booking-settings';

export const metadata = { title: 'Настройки записи — ПроМакс' };

export default async function BookingSettingsPage() {
  await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Heading variant="section" font="display" className="uppercase">
        Настройки записи
      </Heading>
      <BookingSettingsForm />
    </div>
  );
}

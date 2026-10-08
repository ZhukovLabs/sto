import { Heading, Text } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { BookingSettingsForm } from '@/features/booking-settings';

export const metadata = { title: 'Настройки записи — ПроМакс' };

export default async function BookingSettingsPage() {
  await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <Heading variant="section" font="display" className="uppercase">
          Настройки записи
        </Heading>
        <Text variant="mono" color="dim" className="tracking-[0.08em]">
          {'// РЕЖИМ РАБОТЫ, ШАГ СЛОТА И ИСКЛЮЧЕНИЯ — ДЛЯ ФОРМЫ «САМ ЗАПИШУСЬ»'}
        </Text>
      </div>
      <BookingSettingsForm />
    </main>
  );
}

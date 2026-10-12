import { Heading } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { NotificationSettingsForm } from '@/features/notifications';

export const metadata = { title: 'Уведомления — ПроМакс' };

export default async function NotificationsPage() {
  await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Heading variant="section" font="display" className="uppercase">
        Уведомления
      </Heading>
      <NotificationSettingsForm />
    </div>
  );
}

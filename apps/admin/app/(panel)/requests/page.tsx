import { Heading } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { InboxTable } from '@/features/inbox';

export const metadata = { title: 'Обращения — ПроМакс' };

export default async function RequestsPage() {
  await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Heading variant="section" font="display" className="uppercase">
        Обращения
      </Heading>
      <InboxTable />
    </div>
  );
}

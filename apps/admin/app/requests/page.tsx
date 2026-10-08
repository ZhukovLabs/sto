import { Heading, Text } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { InboxTable } from '@/features/inbox';

export const metadata = { title: 'Обращения — ПроМакс' };

export default async function RequestsPage() {
  await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <Heading variant="section" font="display" className="uppercase">
          Обращения
        </Heading>
        <Text variant="mono" color="dim" className="tracking-[0.08em]">
          {'// «ПЕРЕЗВОНИТЕ МНЕ» И «САМ ЗАПИШУСЬ» — ПОСЛЕДНИЕ СВЕРХУ'}
        </Text>
      </div>
      <InboxTable />
    </main>
  );
}

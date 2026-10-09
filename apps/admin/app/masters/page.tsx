import { Heading, Text } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { MastersTable } from './masters-table';

export const metadata = { title: 'Мастера — ПроМакс' };

export default async function MastersPage() {
  await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <Heading variant="section" font="display" className="uppercase">
          Мастера
        </Heading>
        <Text variant="mono" color="dim" className="tracking-[0.08em]">
          {'// ЗАЯВКИ УХОДЯТ ВСЕМ АКТИВНЫМ. CHAT_ID — ИЗ ОТВЕТА БОТА'}
        </Text>
      </div>
      <MastersTable />
    </main>
  );
}

import { Heading } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { MastersTable } from './masters-table';

export const metadata = { title: 'Мастера — ПроМакс' };

export default async function MastersPage() {
  await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Heading variant="section" font="display" className="uppercase">
        Мастера
      </Heading>
      <MastersTable />
    </div>
  );
}

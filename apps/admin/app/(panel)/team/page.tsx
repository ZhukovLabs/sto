import { Heading } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { TeamAdmin } from '@/features/team-admin';

export const metadata = { title: 'Команда — ПроМакс' };

export default async function TeamAdminPage() {
  await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Heading variant="section" font="display" className="uppercase">
        Команда
      </Heading>
      <TeamAdmin />
    </div>
  );
}

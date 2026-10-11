import { Heading, Text } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { TeamAdmin } from '@/features/team-admin';

export const metadata = { title: 'Команда — ПроМакс' };

export default async function TeamAdminPage() {
  await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <Heading variant="section" font="display" className="uppercase">
          Команда
        </Heading>
        <Text variant="mono" color="dim" className="tracking-[0.08em]">
          {'// СОСТАВ · ФОТО · ПОРЯДОК НА САЙТЕ'}
        </Text>
      </div>
      <TeamAdmin />
    </main>
  );
}

import { Heading } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { SettingsTabs } from '@/features/settings';

export const metadata = { title: 'Настройки — ПроМакс' };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireUser();
  const { tab } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Heading variant="section" font="display" className="uppercase">
        Настройки
      </Heading>
      <SettingsTabs initialTab={tab} />
    </div>
  );
}

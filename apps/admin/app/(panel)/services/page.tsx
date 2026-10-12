import { Heading } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { ServicesAdmin } from '@/features/services-admin';

export const metadata = { title: 'Услуги — ПроМакс' };

export default async function ServicesAdminPage() {
  await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Heading variant="section" font="display" className="uppercase">
        Услуги и цены
      </Heading>
      <ServicesAdmin />
    </div>
  );
}

import { Heading } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { FaqAdmin } from '@/features/faq-admin';

export const metadata = { title: 'FAQ — ПроМакс' };

export default async function FaqPage() {
  await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Heading variant="section" font="display" className="uppercase">
        Вопросы и ответы
      </Heading>
      <FaqAdmin />
    </div>
  );
}

import { Heading } from '@sto/ui';
import { requireUser } from '@/lib/auth';
import { NewsAdmin } from '@/features/news-admin';

export const metadata = { title: 'Новости — ПроМакс' };

export default async function NewsPage() {
  await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Heading variant="section" font="display" className="uppercase">
        Новости
      </Heading>
      <NewsAdmin />
    </div>
  );
}

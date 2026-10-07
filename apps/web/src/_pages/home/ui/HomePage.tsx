import { Hero } from '@/widgets/hero';
import { Services } from '@/widgets/services';
import { Trust } from '@/widgets/trust';
import { How } from '@/widgets/how';
import { Contacts } from '@/widgets/contacts';

export function HomePage() {
  return (
    <main>
      <Hero />
      <Services />
      <Trust />
      <How />
      <Contacts />
    </main>
  );
}

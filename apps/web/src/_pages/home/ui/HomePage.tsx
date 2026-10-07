import { Header } from '@/widgets/header';
import { Hero } from '@/widgets/hero';
import { Services } from '@/widgets/services';
import { Trust } from '@/widgets/trust';

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Trust />
        <section id="how" />
        <section id="brands" />
        <section id="contacts" />
      </main>
    </>
  );
}

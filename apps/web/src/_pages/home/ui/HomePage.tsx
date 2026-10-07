import { Header } from '@/widgets/header';
import { Hero } from '@/widgets/hero';
import { Services } from '@/widgets/services';

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <section id="trust" />
        <section id="how" />
        <section id="brands" />
        <section id="contacts" />
      </main>
    </>
  );
}

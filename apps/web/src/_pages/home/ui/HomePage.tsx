import { Header } from '@/widgets/header';
import { Hero } from '@/widgets/hero';

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <section id="services" />
        <section id="trust" />
        <section id="how" />
        <section id="brands" />
        <section id="contacts" />
      </main>
    </>
  );
}

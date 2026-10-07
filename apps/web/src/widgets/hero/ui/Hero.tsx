import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { Button, Container, Heading, Text } from '@/shared/ui';
import { CallbackButton } from '@/features/callback-request';
import { site } from '@/shared/config/site';

export function Hero() {
  return (
    <section
      id="hero"
      className="flex min-h-[calc(100dvh-3.5rem)] flex-col border-b border-border sm:min-h-[calc(100dvh-4rem)]"
    >
      <Container
        size="site"
        className="flex flex-1 flex-col justify-center pb-12 pt-12 lg:pb-12 lg:pt-16"
      >
        <div className="grid my-auto items-start gap-10 lg:grid-cols-[7fr_5fr] lg:gap-12">
          <div className="flex flex-col gap-[30px]">
            <Heading variant="display-2xl" font="display" className="uppercase">
              <span className="block overflow-hidden pb-[0.08em]">
                <span className="block animate-line-reveal [animation-delay:80ms] motion-reduce:animate-none">
                  Ремонт <span className="text-primary">без</span>
                </span>
              </span>
              <span className="block overflow-hidden pb-[0.08em]">
                <span className="block animate-line-reveal text-primary [animation-delay:180ms] motion-reduce:animate-none">
                  сюрпризов
                </span>
              </span>
            </Heading>

            <Text
              variant="mono"
              color="dim"
              className="animate-rise [animation-delay:260ms] tracking-[0.06em] motion-reduce:animate-none"
            >
              {site.city.toUpperCase()} · ОТКРЫВАЕМСЯ В НОЯБРЕ
            </Text>

            <Text
              variant="body-lg"
              color="muted"
              className="max-w-[520px] animate-rise [animation-delay:320ms] motion-reduce:animate-none"
            >
              Диагностика, обслуживание, мелкий и средний ремонт. Первым 20 клиентам — диагностика
              подвески бесплатно. Окончательную цену называем до начала работ — и она не меняется.
            </Text>

            <div className="flex animate-rise flex-col items-stretch gap-3 [animation-delay:380ms] sm:flex-row sm:flex-wrap sm:items-center sm:gap-3.5 motion-reduce:animate-none">
              <CallbackButton size="lg" pill className="sm:min-w-[220px]">
                Записаться
              </CallbackButton>
              <Button variant="outline" size="lg" pill href="#services">
                Услуги и цены
              </Button>
            </div>
          </div>

          <div className="relative -left-4 w-[calc(100%+2rem)] aspect-[4/3] animate-photo-in overflow-hidden rounded-none border border-border [animation-delay:150ms] max-sm:border-x-0 sm:left-0 sm:w-auto sm:aspect-[552/539] sm:rounded-2xl motion-reduce:animate-none">
            <Image
              src="/hero/garage.webp"
              alt="Мастер за работой в гараже СТО «ПроМакс»"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
            <video
              className="absolute inset-0 size-full object-cover motion-reduce:hidden"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
            >
              <source src="/hero/garage-loop.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        <a
          href="#services"
          className="group mt-10 flex animate-rise items-center gap-3.5 [animation-delay:440ms] pb-1 motion-reduce:animate-none"
        >
          <Text
            variant="caption"
            className="font-mono uppercase tracking-[0.14em] text-content-dim transition-colors group-hover:text-content"
          >
            Услуги ниже
          </Text>
          <span
            aria-hidden="true"
            className="h-px flex-1 bg-border transition-colors group-hover:bg-primary/40"
          />
          <ArrowDown
            aria-hidden="true"
            className="size-4 shrink-0 text-content-dim transition-all group-hover:translate-y-0.5 group-hover:text-primary"
          />
        </a>
      </Container>
    </section>
  );
}

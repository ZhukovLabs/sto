import Image from 'next/image';
import { Button, Container, Heading, Text } from '@/shared/ui';
import { CallbackButton } from '@/features/callback-request';

export function Hero() {
  return (
    <section id="hero" className="border-b border-border">
      <Container size="site" className="pb-12 pt-12 lg:pt-16">
        <div className="grid items-start gap-10 lg:grid-cols-[7fr_5fr] lg:gap-12">
          <div className="flex flex-col gap-[30px]">
            <Heading variant="display-2xl" font="display" className="uppercase">
              <span className="block overflow-hidden pb-[0.08em]">
                <span className="block animate-line-reveal [animation-delay:80ms] [word-spacing:0.18em] motion-reduce:animate-none">
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
              variant="body-lg"
              color="muted"
              className="max-w-[552px] text-balance animate-rise [animation-delay:260ms] motion-reduce:animate-none"
            >
              <span className="text-primary">Автосервис в Гомеле</span>: замена масла,{' '}
              <span className="text-primary">ремонт двигателя, тормозов и подвески</span>. Смету
              считаем, прежде чем тронуть машину. Нашли то, чего нет в смете? Сначала спросим вас.
              Молчаливых доплат не будет.
            </Text>

            <div className="flex animate-rise flex-col items-stretch gap-3 [animation-delay:380ms] sm:flex-row sm:flex-wrap sm:items-center sm:gap-3.5 motion-reduce:animate-none">
              <CallbackButton id="hero-cta" size="lg" pill className="sm:min-w-[220px]">
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
              poster="/hero/garage.webp"
              aria-hidden="true"
            >
              <source src="/hero/garage-loop.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </Container>
    </section>
  );
}

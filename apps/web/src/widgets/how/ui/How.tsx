import { Container, Heading, Reveal, Text } from '@/shared/ui';

const STEPS = [
  {
    title: 'Заявка',
    note: 'звонок или сообщение — подбираем время',
  },
  {
    title: 'Диагностика',
    note: 'осматриваем машину и называем причину',
  },
  {
    title: 'Смета до ремонта',
    note: 'работы и цены фиксируем на бумаге; после согласования сумма не меняется',
  },
  {
    title: 'Ремонт',
    note: 'делаем только то, что вошло в смету',
  },
  {
    title: 'Гарантия',
    note: '3 месяца или 5 000 км на работы — что наступит раньше; договор и акт',
  },
] as const;

export function How() {
  return (
    <section id="how" className="scroll-mt-20 border-b border-border sm:scroll-mt-24">
      <Container size="site" className="py-16 lg:py-[72px]">
        <Reveal>
          <Heading variant="section" font="display" as="h2" className="uppercase">
            Как мы работаем
          </Heading>
        </Reveal>
        <Reveal delay={80} className="mt-3 max-w-[640px]">
          <Text variant="body-lg" color="muted" className="leading-normal">
            Что нашли, что меняем, сколько стоит — всё проговариваем до старта.
          </Text>
        </Reveal>

        <ul className="mt-10 border-t border-border">
          {STEPS.map((step, index) => {
            const isLast = index === STEPS.length - 1;
            return (
              <li key={step.title}>
                <Reveal
                  delay={120 + index * 80}
                  className={`group grid gap-x-8 gap-y-1 border-b border-border py-5 pl-5 sm:grid-cols-[auto_1fr] sm:items-center${
                    isLast
                      ? ' bg-gradient-to-r from-primary/10 to-transparent shadow-[inset_2px_0_0_0_var(--color-primary)]'
                      : ''
                  }`}
                >
                  <Heading
                    variant="stat"
                    font="display"
                    aria-hidden
                    className={`tabular-nums select-none text-transparent [-webkit-text-stroke:1.5px_var(--num-stroke,var(--color-border))] transition-[-webkit-text-stroke-color] sm:w-[2.1ch]${
                      isLast
                        ? ' [--num-stroke:var(--color-primary)]'
                        : ' group-hover:[--num-stroke:var(--color-primary)]'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </Heading>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="text-lg font-bold uppercase tracking-wide text-content">
                        {step.title}
                      </span>
                      {isLast && (
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 font-mono text-mono text-primary">
                          3 мес / 5 000 км
                        </span>
                      )}
                    </div>
                    <span className="text-sm leading-relaxed text-content-muted">{step.note}</span>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

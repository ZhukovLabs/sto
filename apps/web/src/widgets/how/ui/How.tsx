import { Container, Heading, Text } from '@/shared/ui';

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
    note: 'перечень работ и цены — до начала работ',
  },
  {
    title: 'Цена зафиксирована',
    note: 'согласовали сумму — она не меняется',
  },
  {
    title: 'Ремонт',
    note: 'делаем работу строго по смете',
  },
  {
    title: 'Гарантия',
    note: '6 месяцев на работы, договор и акт',
  },
] as const;

export function How() {
  return (
    <section id="how" className="border-b border-border">
      <Container size="site" className="py-16 lg:py-[72px]">
        <Heading variant="section" font="display" as="h2" className="uppercase">
          Как мы работаем
        </Heading>
        <Text variant="body-lg" color="muted" className="mt-3 max-w-[640px] leading-normal">
          Приехали заменить колодки — не уедете со счётом на ремонт подвески. Смету считаем до
          начала работ, цена после согласования не меняется.
        </Text>

        <ul className="mt-9 divide-y divide-border border-y border-border">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-x-6 gap-y-1 py-5 sm:grid-cols-[auto_1fr] sm:items-baseline"
            >
              <Heading
                variant="stat"
                font="display"
                color="accent"
                className="w-14 text-right leading-none"
              >
                {index + 1}
              </Heading>
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold uppercase tracking-wide text-content">
                  {step.title}
                </span>
                <span className="text-sm leading-relaxed text-content-muted">{step.note}</span>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

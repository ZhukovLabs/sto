import Image from 'next/image';
import { Container, Heading, Text } from '@/shared/ui';
import { getTeam, getTrustFacts } from '@/entities/master';

export async function Trust() {
  const [team, facts] = await Promise.all([getTeam(), getTrustFacts()]);

  return (
    <section id="trust" className="border-b border-border">
      <Container size="site" className="py-16 lg:py-[72px]">
        <Heading variant="section" font="display" as="h2" className="uppercase">
          Команда
        </Heading>
        <Text variant="body" color="muted" className="mt-3 max-w-[560px] leading-normal">
          Небольшая смена: каждый отвечает за свой узел и подписывает свою работу.
        </Text>

        <div className="mt-8 grid gap-3.5 sm:grid-cols-3">
          {team.map((member) => (
            <article key={member.name} className="rounded-lg border border-border bg-panel p-5">
              <div
                className={`relative -mx-5 -mt-5 mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-t-lg border-b ${
                  member.photo ? '' : 'border-dashed'
                }`}
              >
                {member.photo ? (
                  <Image
                    src={member.photo}
                    alt={member.photoAlt ?? member.name}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-2 font-mono text-content-dim">
                    <span className="text-2xl">1:1</span>
                    <span className="text-caption uppercase tracking-[0.1em]">фото мастера</span>
                  </span>
                )}
              </div>
              <span className="text-lg font-bold text-content">{member.name}</span>
              <span className="mt-0.5 block text-sm text-primary">{member.role}</span>
              <span className="mt-1.5 block text-sm leading-relaxed text-content-muted">
                {member.spec}
              </span>
            </article>
          ))}
        </div>

        <ul className="mt-3.5 grid gap-y-6 border-t border-border pt-7 sm:grid-cols-3 sm:divide-x sm:divide-border">
          {facts.map((fact) => (
            <li
              key={fact.title}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5 sm:px-7 sm:first:pl-0 sm:last:pr-0"
            >
              <Heading
                variant="stat"
                font="display"
                color="accent"
                className="shrink-0 whitespace-nowrap leading-none"
              >
                {fact.value}
                {fact.unit ? (
                  <span className="ml-1 text-[0.45em] font-bold">{fact.unit}</span>
                ) : null}
              </Heading>
              <span className="flex flex-col gap-1">
                <span className="text-base font-semibold text-content">{fact.title}</span>
                <span className="text-sm leading-normal text-content-muted">{fact.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

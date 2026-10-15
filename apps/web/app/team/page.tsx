import type { Metadata } from 'next';
import Image from 'next/image';
import { Breadcrumbs, Container, Heading, Text } from '@/shared/ui';
import { getTeam, type TeamMember } from '@/entities/master';
import { CallbackButton } from '@/features/callback-request';
import { site } from '@/shared/config/site';

export const metadata: Metadata = {
  title: `Команда — ${site.name}`,
  description: `Мастера ${site.name} в ${site.city}: вы общаетесь с тем, кто крутит гайки, — не с менеджером.`,
  alternates: { canonical: '/team' },
};

function MasterCard({ member, index }: { member: TeamMember; index: number }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-panel transition-colors duration-300 hover:border-border-strong">
      <div className="relative aspect-[4/3] border-b border-border bg-panel-2">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.photoAlt ?? member.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 font-mono text-content-dim">
            <span className="text-2xl">1:1</span>
            <span className="text-caption uppercase tracking-[0.1em]">фото мастера</span>
          </span>
        )}
        <span className="absolute left-4 top-4 rounded-full border border-border bg-bg/80 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.1em] text-content-dim backdrop-blur-sm">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="font-mono text-caption uppercase tracking-[0.12em] text-primary">
          {member.role}
        </span>
        <Heading variant="h3" font="display" as="h2" className="uppercase">
          {member.name}
        </Heading>
        <Text variant="body" color="muted" className="leading-normal">
          {member.spec}
        </Text>
      </div>
    </article>
  );
}

export default async function TeamPage() {
  const team = await getTeam();

  return (
    <>
      <section className="border-b border-border">
        <Container size="site" className="pb-8 pt-8 sm:pb-10 sm:pt-10">
          <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Команда' }]} />
          <Heading variant="display-sm" font="display" as="h1" className="mt-5 uppercase">
            Команда
          </Heading>
        </Container>
      </section>

      <Container size="site" className="pb-20 pt-10">
        <Text variant="body" color="muted" className="max-w-[560px] leading-normal">
          Вы общаетесь с тем, кто крутит гайки, — не с менеджером.
        </Text>

        {team.length > 0 ? (
          <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member, index) => (
              <MasterCard key={member.name} member={member} index={index} />
            ))}
          </div>
        ) : (
          <Text variant="body" color="muted" className="mt-8">
            Состав команды скоро появится — а пока записывайтесь по телефону, распределим мастера
            под вашу задачу.
          </Text>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-lg border border-border bg-panel p-6">
          <div className="flex flex-col gap-1">
            <Heading variant="h3" font="display" as="h2" className="uppercase">
              Запишитесь — подберём мастера под задачу
            </Heading>
            <Text variant="caption" color="dim">
              Смета до начала работ, договор и гарантия 3 месяца или 5 000 км.
            </Text>
          </div>
          <CallbackButton size="md" pill>
            Записаться
          </CallbackButton>
        </div>
      </Container>
    </>
  );
}

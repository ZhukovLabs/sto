import { Container, Heading, Reveal, Text } from '@/shared/ui';
import { getTeam } from '@/entities/master';
import { TeamBrowser } from './TeamBrowser';

export async function Trust() {
  const team = await getTeam();

  return (
    <section id="trust" className="scroll-mt-20 border-b border-border sm:scroll-mt-24">
      <Container size="site" className="py-16 lg:py-[72px]">
        <Reveal>
          <Heading variant="section" font="display" as="h2" className="uppercase">
            Команда
          </Heading>
        </Reveal>
        <Reveal delay={80} className="mt-3 max-w-[560px]">
          <Text variant="body" color="muted" className="leading-normal">
            Вы общаетесь с тем, кто крутит гайки, — не с менеджером.
          </Text>
        </Reveal>

        <Reveal delay={140}>
          <TeamBrowser team={team} />
        </Reveal>
      </Container>
    </section>
  );
}

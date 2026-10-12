import { Container, Heading, Text } from '@/shared/ui';
import { getTeam } from '@/entities/master';
import { TeamBrowser } from './TeamBrowser';

export async function Trust() {
  const team = await getTeam();

  return (
    <section id="trust" className="border-b border-border">
      <Container size="site" className="py-16 lg:py-[72px]">
        <Heading variant="section" font="display" as="h2" className="uppercase">
          Команда
        </Heading>
        <Text variant="body" color="muted" className="mt-3 max-w-[560px] leading-normal">
          Небольшая смена: каждый отвечает за свой узел и подписывает свою работу.
        </Text>

        <TeamBrowser team={team} />
      </Container>
    </section>
  );
}

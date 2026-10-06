import { Badge, Button, Heading, Text } from '@sto/ui';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <Badge variant="accent" dot>
        Открытие — ноябрь
      </Badge>
      <Heading font="display" variant="display-md">
        МаксШнакс
      </Heading>
      <Text variant="lead" className="max-w-xl text-content-muted">
        Тестовая страница — просто текст
      </Text>
      <Button size="lg">Записаться</Button>
    </main>
  );
}

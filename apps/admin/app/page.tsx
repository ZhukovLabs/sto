import { Badge, Button, Heading, Text } from '@sto/ui';

export default function AdminHomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <Badge variant="neutral">Админка</Badge>
      <Heading font="display" variant="h1">
        МаксШнакс
      </Heading>
      <Text variant="lead" className="max-w-xl text-content-muted">
        Тестовая страница — просто текст
      </Text>
      <Button variant="secondary">Обновить</Button>
    </main>
  );
}

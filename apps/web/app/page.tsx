import type { HealthResponse } from '@sto/types';
import { TestButton } from '@sto/ui';

const importCheck: HealthResponse = { status: 'ok', uptime: 0 };

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold text-brand-950">web (заглушка)</h1>
      <p className="text-brand-500">Проверка импортов: @sto/types → web, {importCheck.status}</p>
      <TestButton label="Тест @sto/ui" />
    </main>
  );
}

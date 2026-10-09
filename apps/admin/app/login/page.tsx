import { Wrench } from 'lucide-react';
import { Heading, Text } from '@sto/ui';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between gap-12 overflow-hidden border-r border-border bg-panel-2 p-12 lg:flex">
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 size-[28rem] rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary">
            <Wrench aria-hidden="true" className="size-4 text-primary-ink" strokeWidth={2} />
          </span>
          <Text variant="label" className="font-mono uppercase tracking-[0.14em]">
            ПроМакс
          </Text>
        </div>

        <div className="relative flex max-w-md flex-col gap-5">
          <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-primary" />
          <Heading variant="display-lg" font="display" className="uppercase">
            Ремонт без сюрпризов
          </Heading>
          <Text variant="mono" color="dim" className="tracking-[0.08em]">
            {'// ПАНЕЛЬ УПРАВЛЕНИЯ СЕРВИСОМ'}
          </Text>
        </div>

        <Text variant="micro" color="dim" className="relative font-mono">
          © 2026 · СТО «ПроМакс» · Гомель
        </Text>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col items-center gap-3.5 lg:items-start">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary lg:hidden">
              <Wrench aria-hidden="true" className="size-4.5 text-primary-ink" strokeWidth={2} />
            </span>
            <div className="flex flex-col items-center gap-1.5 lg:items-start">
              <Heading variant="section" font="display" className="uppercase">
                Панель управления
              </Heading>
              <Text variant="mono" color="dim" className="tracking-[0.08em]">
                СТО «ПроМакс»
              </Text>
            </div>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}

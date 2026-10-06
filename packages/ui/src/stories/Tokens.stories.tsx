import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from '../components/Heading/Heading';
import { Text } from '../components/Text/Text';
import { Badge } from '../components/Badge/Badge';
import { Card } from '../components/Card/Card';

const meta = {
  title: 'Design/Tokens',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const palette = [
  { name: 'bg', token: '--color-bg' },
  { name: 'bg-deep', token: '--color-bg-deep' },
  { name: 'panel', token: '--color-panel' },
  { name: 'panel-2', token: '--color-panel-2' },
  { name: 'border', token: '--color-border' },
  { name: 'border-strong', token: '--color-border-strong' },
  { name: 'content', token: '--color-content' },
  { name: 'content-muted', token: '--color-content-muted' },
  { name: 'content-dim', token: '--color-content-dim' },
  { name: 'primary', token: '--color-primary' },
  { name: 'primary-hover', token: '--color-primary-hover' },
  { name: 'primary-ink', token: '--color-primary-ink' },
  { name: 'success', token: '--color-success' },
  { name: 'warning', token: '--color-warning' },
  { name: 'danger', token: '--color-danger' },
];

const accentRamp = [
  'accent-50',
  'accent-100',
  'accent-200',
  'accent-300',
  'accent-400',
  'accent-500',
  'accent-600',
  'accent-700',
  'accent-800',
  'accent-900',
  'accent-950',
];

const typeScale = [
  { variant: 'display-xl', sample: 'МаксШнакс', spec: '72 / 1.05 / -0.02em' },
  { variant: 'display-lg', sample: 'Без сюрпризов', spec: '56 / 1.1 / -0.02em' },
  { variant: 'display-md', sample: '0 Р', spec: '44 / 1.15 / -0.015em' },
  { variant: 'h1', sample: 'Автосервис в Гомеле', spec: '40 / 1.15 / -0.01em' },
  { variant: 'h2', sample: 'Услуги и цены', spec: '32 / 1.2 / -0.01em' },
  { variant: 'h3', sample: 'Доверие мастеру', spec: '24 / 1.25' },
  { variant: 'h4', sample: 'Как мы работаем', spec: '20 / 1.3' },
] as const;

const textScale = [
  {
    variant: 'lead',
    sample: 'Изношенная деталь ложится на стол — трогайте руками.',
    spec: '18 / 1.6',
  },
  { variant: 'body-lg', sample: 'Цена называется до работ и не растёт после.', spec: '16 / 1.6' },
  { variant: 'body', sample: 'Замер остатков линейкой, а не на глаз.', spec: '14 / 1.55' },
  { variant: 'caption', sample: 'Первым 20 — диагностика 0 р', spec: '12 / 1.5' },
  { variant: 'label', sample: 'Label uppercase', spec: '12 / 1.4 / +0.08em' },
  { variant: 'mono', sample: '+375 29 000-00-00', spec: '13 / 1.5 mono' },
] as const;

const spacing = [
  { name: 'space-block', value: '--space-block', px: '48px' },
  { name: 'space-section-sm', value: '--space-section-sm', px: '64px' },
  { name: 'space-section', value: '--space-section', px: '96px' },
];

const radii = [
  { name: 'sm', value: 'var(--radius-sm)' },
  { name: 'md', value: 'var(--radius-md)' },
  { name: 'lg', value: 'var(--radius-lg)' },
  { name: 'xl', value: 'var(--radius-xl)' },
  { name: '2xl', value: 'var(--radius-2xl)' },
  { name: 'full', value: '9999px' },
];

const shadows = [
  { name: 'sm', value: '--shadow-sm' },
  { name: 'md', value: '--shadow-md' },
  { name: 'lg', value: '--shadow-lg' },
  { name: 'glow', value: '--shadow-glow' },
];

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Heading variant="h2">Палитра</Heading>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {palette.map((c) => (
          <Card key={c.name} padding="none" className="overflow-hidden">
            <div className="h-16 w-full" style={{ background: `var(${c.token})` }} />
            <div className="flex flex-col gap-0.5 p-3">
              <Text variant="caption" color="strong">
                {c.name}
              </Text>
              <Text variant="mono" color="dim">
                {c.token}
              </Text>
            </div>
          </Card>
        ))}
      </div>
      <Heading variant="h3">Акцентная шкала</Heading>
      <div className="flex overflow-hidden rounded-lg border border-border">
        {accentRamp.map((step) => (
          <div key={step} className="flex-1">
            <div className="h-12 w-full" style={{ background: `var(--color-${step})` }} />
            <Text variant="caption" color="dim" className="block px-1 py-2 text-center">
              {step}
            </Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Heading variant="h2">Заголовки (Unbounded / Inter)</Heading>
        {typeScale.map((t) => (
          <div key={t.variant} className="flex flex-col gap-1">
            <Heading
              variant={t.variant}
              font={t.variant.startsWith('display') ? 'display' : 'body'}
            >
              {t.sample}
            </Heading>
            <Text variant="mono" color="dim">
              {t.variant} · {t.spec}
            </Text>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <Heading variant="h2">Текст (Inter / JetBrains Mono)</Heading>
        {textScale.map((t) => (
          <div key={t.variant} className="flex flex-col gap-1">
            <Text variant={t.variant} color="strong">
              {t.sample}
            </Text>
            <Text variant="mono" color="dim">
              {t.variant} · {t.spec}
            </Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const SpacingAndRadius: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Heading variant="h2">Семантические отступы</Heading>
      <div className="flex flex-col gap-3">
        {spacing.map((s) => (
          <div key={s.name} className="flex items-center gap-4">
            <div className="h-4 bg-primary" style={{ width: `var(${s.value})` }} />
            <Text variant="mono" color="muted">
              {s.name} · {s.px}
            </Text>
          </div>
        ))}
      </div>
      <Heading variant="h2">Радиусы</Heading>
      <div className="flex items-end gap-4">
        {radii.map((r) => (
          <div key={r.name} className="flex flex-col items-center gap-2">
            <div
              className="size-16 border-2 border-primary bg-panel"
              style={{ borderRadius: r.value }}
            />
            <Text variant="caption" color="dim">
              {r.name}
            </Text>
          </div>
        ))}
      </div>
      <Heading variant="h2">Тени</Heading>
      <div className="flex gap-6">
        {shadows.map((s) => (
          <div key={s.name} className="flex flex-col items-center gap-2">
            <div className="size-20 rounded-lg bg-panel" style={{ boxShadow: `var(${s.value})` }} />
            <Text variant="caption" color="dim">
              {s.name}
            </Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Statuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Heading variant="h2">Статусы</Heading>
      <div className="flex flex-wrap gap-3">
        <Badge variant="accent">0 Р · первым 20</Badge>
        <Badge variant="success">Пост свободен</Badge>
        <Badge variant="warning">Осталось 17 мест</Badge>
        <Badge variant="danger">Заполнено</Badge>
        <Badge variant="neutral">Гомель</Badge>
      </div>
    </div>
  ),
};

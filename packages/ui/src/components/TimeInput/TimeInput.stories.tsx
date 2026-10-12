import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TimeInput } from './TimeInput';

const meta = {
  title: 'Components/TimeInput',
  component: TimeInput,
} satisfies Meta<typeof TimeInput>;

export default meta;
type Story = StoryObj<typeof TimeInput>;

function Playground({ initial, label }: { initial: string; label?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex flex-col gap-4">
      <TimeInput value={value} onChange={setValue} label={label} aria-label="Время" />
      <span className="font-mono text-caption text-content-dim">значение: «{value}»</span>
    </div>
  );
}

export const Basic: Story = {
  name: 'Базовое',
  render: () => <Playground initial="09:30" />,
};

export const WithLabel: Story = {
  name: 'С подписью',
  render: () => <Playground initial="" label="Начало смены" />,
};

export const Large: Story = {
  name: 'Большой размер',
  render: () => {
    const [value, setValue] = useState('18:45');
    return <TimeInput value={value} onChange={setValue} size="md" aria-label="Время" />;
  },
};

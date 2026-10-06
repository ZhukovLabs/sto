import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';

const meta = {
  title: 'Typography/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['lead', 'body-lg', 'body', 'caption', 'label', 'mono'],
    },
    color: { control: 'select', options: ['strong', 'muted', 'dim', 'accent', 'inherit'] },
    as: { control: 'text' },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: { variant: 'body-lg', children: 'Цена называется до работ и не растёт после.' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Text variant="lead" color="strong">
        Lead 18/1.6 — изношенная деталь ложится на стол: трогайте руками.
      </Text>
      <Text variant="body-lg">Body large 16/1.6 — основной текст страниц и карточек.</Text>
      <Text variant="body">Body 14/1.55 — вспомогательный текст, описания услуг.</Text>
      <Text variant="caption" color="dim">
        Caption 12/1.5 — сноски и подписи
      </Text>
      <Text variant="label" color="accent">
        Label 12 uppercase +0.08em
      </Text>
      <Text variant="mono">mono 13/1.5 — +375 29 000-00-00 · Пн–Сб 9:00–20:00</Text>
    </div>
  ),
};

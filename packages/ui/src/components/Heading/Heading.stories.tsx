import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from './Heading';

const meta = {
  title: 'Typography/Heading',
  component: Heading,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['display-2xl', 'display-xl', 'display-lg', 'display-md', 'h1', 'h2', 'h3', 'h4'],
    },
    color: { control: 'select', options: ['strong', 'muted', 'dim', 'accent', 'inherit'] },
    font: { control: 'radio', options: ['display', 'body'] },
    as: { control: 'text' },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  args: { variant: 'h1', children: 'Ремонт без сюрпризов' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Heading variant="display-2xl" font="display">
        Ремонт без сюрпризов
      </Heading>
      <Heading variant="display-xl" font="display">
        МаксШнакс
      </Heading>
      <Heading variant="display-lg" font="display">
        Ремонт без сюрпризов
      </Heading>
      <Heading variant="display-md" font="display">
        Ночной гараж
      </Heading>
      <Heading variant="h1">Автосервис в Гомеле</Heading>
      <Heading variant="h2">Услуги и цены</Heading>
      <Heading variant="h3">Доверие мастеру</Heading>
      <Heading variant="h4">Как мы работаем</Heading>
    </div>
  ),
};

export const Accent: Story = {
  args: { variant: 'display-lg', font: 'display', color: 'accent', children: '0 Р' },
};

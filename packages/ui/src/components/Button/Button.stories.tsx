import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Actions/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'outline', 'ghost'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    pill: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { variant: 'primary', size: 'md', children: 'Записаться' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-caption text-content-dim">Варианты</span>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Записаться</Button>
          <Button variant="secondary">Заказать звонок</Button>
          <Button variant="outline">Услуги и цены</Button>
          <Button variant="ghost">Подробнее</Button>
          <Button variant="primary" pill>
            Записаться · пилюля
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-caption text-content-dim">Размеры</span>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-caption text-content-dim">Состояния</span>
        <div className="flex flex-wrap items-center gap-4">
          <Button loading>Отправка</Button>
          <Button disabled>Недоступно</Button>
          <Button variant="secondary" className="w-64">
            Полная ширина
          </Button>
        </div>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button loading>Отправка</Button>
      <Button disabled>Недоступно</Button>
      <Button variant="secondary" fullWidth>
        Полная ширина
      </Button>
    </div>
  ),
};

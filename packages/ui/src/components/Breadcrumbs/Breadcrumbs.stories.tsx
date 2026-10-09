import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from './Breadcrumbs';

const meta = {
  title: 'Navigation/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Главная', href: '/' },
      { label: 'Услуги и цены', href: '/services' },
      { label: 'Замена масла', href: '/services/zamena-masla' },
      { label: 'Замена масла двигателя' },
    ],
  },
};

export const Short: Story = {
  args: {
    items: [{ label: 'Главная', href: '/' }, { label: 'Контакты' }],
  },
};

export const LongLabels: Story = {
  name: 'Длинные подписи (обрезка)',
  args: {
    items: [
      { label: 'Главная', href: '/' },
      {
        label: 'Диагностика и ремонт электронных систем управления двигателем',
        href: '/services/diagnostics',
      },
      {
        label: 'Компьютерная диагностика всех электронных блоков автомобиля',
      },
    ],
  },
  render: (args) => (
    <div className="max-w-xs border border-border rounded-lg p-4">
      <Breadcrumbs {...args} />
    </div>
  ),
};

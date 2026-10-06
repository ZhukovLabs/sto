import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta = {
  title: 'Forms/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

const services = [
  { value: 'diag', label: 'Диагностика — 0 р' },
  { value: 'oil', label: 'Масло и фильтры — от 15 р' },
  { value: 'brakes', label: 'Колодки и диски — от 15 р' },
  { value: 'grm', label: 'Ремень ГРМ — от 80 р' },
  { value: 'ac', label: 'Кондиционер — от 100 р' },
  {
    value: 'long',
    label: 'Комплексная диагностика тормозной системы с протоколом осмотра — от 40 р',
  },
];

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="w-96">{children}</div>
);

export const Default: Story = {
  render: (args) => (
    <Frame>
      <Select {...args} />
    </Frame>
  ),
  args: {
    label: 'Услуга',
    placeholder: 'Выберите услугу',
    options: services,
    helper: 'Не знаете точно — выберите диагностику',
  },
};

export const WithError: Story = {
  render: (args) => (
    <Frame>
      <Select {...args} />
    </Frame>
  ),
  args: {
    label: 'Услуга',
    placeholder: 'Выберите услугу',
    options: services,
    error: 'Выберите услугу или диагностику',
  },
};

const allServices = [
  'Диагностика — 0 р',
  'Масло и фильтры — от 15 р',
  'Колодки и диски — от 15 р',
  'Ремень ГРМ — от 80 р',
  'Сцепление — от 70 р',
  'Развал-схождение — от 20 р',
  'Шиномонтаж — от 6 р/колесо',
  'Кондиционер — от 100 р',
  'Подвеска — от 30 р',
  'Электрика — от 20 р',
  'Выхлопная система — от 40 р',
  'Тормозная система — от 35 р',
  'Свечи и катушки — от 25 р',
  'Ремонт ходовой — от 50 р',
  'Комплексная диагностика тормозной системы с протоколом осмотра — от 40 р',
].map((label, i) => ({ value: `s${i}`, label }));

export const ManyOptions: Story = {
  render: (args) => (
    <Frame>
      <Select {...args} />
    </Frame>
  ),
  args: {
    label: 'Услуга',
    placeholder: 'Выберите услугу',
    options: allServices,
    helper: 'Полный прайс — 15 позиций, список скроллится',
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta = {
  title: 'Forms/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: 'Телефон',
    placeholder: '+375 29 000-00-00',
    helper: 'МТС или A1 — звоним с 9:00 до 20:00',
    size: 'md',
  },
};

export const WithError: Story = {
  args: {
    label: 'Телефон',
    placeholder: '+375 __ ___-__-__',
    error: 'Укажите телефон в формате +375 XX XXX-XX-XX',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-5">
      <Input size="sm" label="Имя" placeholder="Small" />
      <Input size="md" label="Телефон" placeholder="Medium" />
      <Input size="lg" label="Марка авто" placeholder="Large" disabled />
    </div>
  ),
};

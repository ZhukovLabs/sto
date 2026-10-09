import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta = {
  title: 'Forms/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: { error: { control: 'text' }, rows: { control: 'number' } },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    label: 'Что с машиной',
    placeholder: 'Например: стук спереди справа на кочках…',
    helper: 'Можно коротко — мастер уточнит при записи',
  },
};

export const WithError: Story = {
  args: {
    label: 'Что с машиной',
    placeholder: 'Опишите симптомы',
    error: 'Пара слов о симптомах поможет подготовиться к визиту',
  },
};

export const WithCounter: Story = {
  args: {
    label: 'Комментарий (необязательно)',
    placeholder: 'Пара слов о том, что беспокоит',
    rows: 6,
    maxLength: 500,
    defaultValue: 'Стучит спереди справа на кочках',
  },
};

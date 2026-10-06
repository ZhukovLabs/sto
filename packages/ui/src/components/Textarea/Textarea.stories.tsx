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

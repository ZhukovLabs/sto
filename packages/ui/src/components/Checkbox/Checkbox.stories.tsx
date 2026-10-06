import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: { error: { control: 'text' }, disabled: { control: 'boolean' } },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: 'Согласен на обработку персональных данных',
    defaultChecked: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Согласен на обработку персональных данных',
    error: 'Без согласия мы не сможем принять заявку',
  },
};

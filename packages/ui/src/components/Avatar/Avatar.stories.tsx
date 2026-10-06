import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';

const meta = {
  title: 'Data Display/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    shape: { control: 'inline-radio', options: ['circle', 'square'] },
    src: { control: 'text' },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: { name: 'Максим Шнакс', size: 'lg' },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="Максим" size="sm" />
      <Avatar name="Максим" size="md" />
      <Avatar name="Максим Шнакс" size="lg" />
      <Avatar name="Максим Шнакс" size="xl" />
      <Avatar name="Максим Шнакс" size="xl" shape="square" />
    </div>
  ),
};

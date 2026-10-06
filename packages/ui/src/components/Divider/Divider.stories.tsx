import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider';

const meta = {
  title: 'Data Display/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-4">
      <span className="text-body">Услуги и цены</span>
      <Divider />
      <span className="text-body">Доверие мастеру</span>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-10 items-center gap-4">
      <span className="text-body">Слева</span>
      <Divider orientation="vertical" />
      <span className="text-body">Справа</span>
    </div>
  ),
};

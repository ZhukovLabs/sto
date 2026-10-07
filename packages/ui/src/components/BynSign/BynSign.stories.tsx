import type { Meta, StoryObj } from '@storybook/react-vite';
import { BynSign } from './BynSign';

const meta: Meta<typeof BynSign> = {
  title: 'Data display/BynSign',
  component: BynSign,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BynSign>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <span className="font-display text-display-lg uppercase text-content">
        0 <BynSign className="ml-[0.1em] inline h-[0.72em] w-auto" />
      </span>
      <span className="text-body-lg text-content-muted">
        от 15 <BynSign className="ml-[0.1em] inline h-[0.72em] w-auto" />
      </span>
    </div>
  ),
};

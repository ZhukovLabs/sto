import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';
import { Card } from '../Card/Card';

const meta = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: { width: '240px', height: '16px' },
};

export const ServiceCardSkeleton: Story = {
  render: () => (
    <Card className="w-80">
      <div className="flex flex-col gap-3">
        <Skeleton width="64px" height="12px" />
        <Skeleton width="70%" height="20px" />
        <Skeleton height="14px" />
        <Skeleton width="45%" height="14px" />
        <Skeleton width="90px" height="28px" rounded="full" />
      </div>
    </Card>
  ),
};

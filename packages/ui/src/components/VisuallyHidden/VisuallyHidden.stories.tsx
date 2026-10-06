import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisuallyHidden } from './VisuallyHidden';
import { Button } from '../Button/Button';

const meta = {
  title: 'Utils/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs'],
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof VisuallyHidden>;

export const Default: Story = {
  render: () => (
    <Button>
      <VisuallyHidden>Позвонить в автосервис</VisuallyHidden>
      <span aria-hidden="true">📞</span>
    </Button>
  ),
};

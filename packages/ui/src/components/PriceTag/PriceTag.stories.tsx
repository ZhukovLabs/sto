import type { Meta, StoryObj } from '@storybook/react-vite';
import { PriceTag } from './PriceTag';

const meta = {
  title: 'Data Display/PriceTag',
  component: PriceTag,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    highlight: { control: 'boolean' },
  },
} satisfies Meta<typeof PriceTag>;

export default meta;
type Story = StoryObj<typeof PriceTag>;

export const Default: Story = {
  args: { prefix: 'от', value: '15', suffix: 'р.', size: 'md' },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <PriceTag prefix="от" value="15" suffix="р." size="sm" />
      <PriceTag prefix="от" value="15" suffix="р." size="md" />
      <PriceTag prefix="от" value="80" suffix="р." size="lg" />
      <PriceTag value="0" suffix="р." size="md" highlight />
      <PriceTag prefix="было" value="25" suffix="р." oldValue="35 р." size="md" />
    </div>
  ),
};

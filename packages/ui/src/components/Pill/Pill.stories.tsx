import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pill } from './Pill';

const meta = {
  title: 'Data Display/Pill',
  component: Pill,
  tags: ['autodocs'],
  argTypes: {
    active: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof Pill>;

export const Default: Story = {
  args: { children: 'Renault', active: false },
};

export const BrandFilter: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Pill active>Renault</Pill>
      <Pill>Peugeot</Pill>
      <Pill>Volkswagen</Pill>
      <Pill size="sm" active>
        Toyota
      </Pill>
      <Pill size="sm">Kia</Pill>
      <Pill size="sm">Hyundai</Pill>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  title: 'Data Display/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'success', 'warning', 'danger'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { variant: 'accent', children: 'Открываемся в ноябре' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="accent">0 Р · первым 20</Badge>
      <Badge variant="neutral">Гомель</Badge>
      <Badge variant="success">Пост свободен</Badge>
      <Badge variant="warning">Осталось 17 мест</Badge>
      <Badge variant="danger">Заполнено</Badge>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  name: 'Базовый',
  args: { content: 'Александр Александр Александр Александр Александр' },
  render: (args) => (
    <div className="flex h-28 items-center justify-center">
      <Tooltip {...args}>
        <span className="max-w-40 truncate rounded-md border border-border bg-panel px-3 py-2">
          Александр Александр…
        </span>
      </Tooltip>
    </div>
  ),
};

export const Bottom: Story = {
  name: 'Снизу',
  args: { content: 'Подсказка снизу', side: 'bottom' },
  render: (args) => (
    <div className="flex h-28 items-center justify-center">
      <Tooltip {...args}>
        <span className="rounded-md border border-border bg-panel px-3 py-2">Наведи</span>
      </Tooltip>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Reveal } from './Reveal';

const meta = {
  title: 'Utility/Reveal',
  component: Reveal,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['up', 'fade', 'wipe'] },
    delay: { control: { type: 'number', min: 0, max: 1000, step: 20 } },
  },
} satisfies Meta<typeof Reveal>;

export default meta;
type Story = StoryObj<typeof Reveal>;

const CARD =
  'flex h-32 items-center justify-center rounded-lg border border-border bg-panel text-body text-content';

export const Default: Story = {
  args: { variant: 'up', delay: 0 },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <p className="text-caption text-content-dim">
        Прокрутите вниз — каждый блок появляется при входе в зону видимости.
      </p>
      <div className={CARD}>Контент без Reveal (всегда виден)</div>
      <div className="h-[90vh]" />
      <Reveal {...args}>
        <div className={CARD}>Reveal — вариант {args.variant}</div>
      </Reveal>
    </div>
  ),
};

export const Cascade: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="h-[90vh]" />
      <p className="text-body text-content-muted">Каскад: такт 80 мс между карточками</p>
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Reveal key={index} delay={index * 80}>
            <div className={CARD}>Карточка {index + 1}</div>
          </Reveal>
        ))}
      </div>
      <div className="h-[60vh]" />
      <Reveal variant="wipe">
        <div className="flex h-14 items-center justify-center rounded-lg bg-primary font-mono text-base font-bold uppercase tracking-[0.12em] text-primary-ink">
          Wipe — выезд слева направо
        </div>
      </Reveal>
    </div>
  ),
};

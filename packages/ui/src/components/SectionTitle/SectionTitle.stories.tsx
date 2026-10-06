import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionTitle } from './SectionTitle';

const meta = {
  title: 'Data Display/SectionTitle',
  component: SectionTitle,
  tags: ['autodocs'],
  argTypes: {
    align: { control: 'inline-radio', options: ['left', 'center'] },
    variant: { control: 'select', options: ['display-md', 'h1', 'h2', 'h3'] },
  },
} satisfies Meta<typeof SectionTitle>;

export default meta;
type Story = StoryObj<typeof SectionTitle>;

export const Default: Story = {
  args: {
    eyebrow: 'УСЛУГИ И ЦЕНЫ',
    title: 'Что делаем и почём',
    description: 'Цена фиксируется до начала работ и не меняется в процессе.',
  },
};

export const Centered: Story = {
  args: {
    align: 'center',
    eyebrow: 'ДОВЕРИЕ',
    title: 'Сначала диагноз, потом решение',
  },
};

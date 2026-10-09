import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedControl } from './SegmentedControl';
import { useState } from 'react';

const meta = {
  title: 'Navigation/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('cards');
    return (
      <SegmentedControl
        aria-label="Вид отображения"
        items={[
          { value: 'cards', label: 'Карточки' },
          { value: 'table', label: 'Таблица' },
        ]}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const WithIcons: Story = {
  render: () => {
    const [value, setValue] = useState('grid');
    return (
      <SegmentedControl
        aria-label="Макет"
        items={[
          { value: 'grid', label: 'Плитка', icon: <span aria-hidden="true">#</span> },
          { value: 'list', label: 'Список', icon: <span aria-hidden="true">=</span> },
          { value: 'map', label: 'Карта', icon: <span aria-hidden="true">@</span> },
        ]}
        value={value}
        onChange={setValue}
      />
    );
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DatePicker } from './DatePicker';

const meta = {
  title: 'Forms/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState('');
      return (
        <div className="max-w-xs">
          <DatePicker
            label="Дата записи"
            value={value}
            onChange={setValue}
            placeholder="Выберите дату"
            isDateDisabled={(iso) => new Date(iso).getDay() === 0}
          />
        </div>
      );
    };
    return <Component />;
  },
};

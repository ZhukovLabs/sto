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
            isDateDisabled={(iso) => new Date(iso).getDay() === 0}
          />
        </div>
      );
    };
    return <Component />;
  },
};

export const ManualInput: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState('');
      return (
        <div className="max-w-xs">
          <DatePicker
            label="Ручной ввод"
            helper="Кликните по полю и введите дату как 15.09.2026, либо откройте календарь кнопкой"
            value={value}
            onChange={setValue}
            min="2025-01-01"
            max="2027-12-31"
            isDateDisabled={(iso) => new Date(iso).getDay() === 0}
          />
        </div>
      );
    };
    return <Component />;
  },
};

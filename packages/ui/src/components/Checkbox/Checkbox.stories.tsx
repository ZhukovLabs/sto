import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

function CheckboxPlayground() {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex max-w-md flex-col gap-5">
      <Checkbox
        checked={checked}
        onChange={setChecked}
        label="Согласен на обработку персональных данных"
      />
      <Checkbox checked={false} onChange={() => {}} label="Не отмечен" />
      <Checkbox checked onChange={() => {}} label="Отмечен" />
      <Checkbox checked={false} onChange={() => {}} label="Ошибка" error="Нужно согласие" />
    </div>
  );
}

export const Default: Story = {
  render: () => <CheckboxPlayground />,
};

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
  const [withError, setWithError] = useState(false);
  return (
    <div className="flex max-w-md flex-col gap-5">
      <Checkbox
        checked={checked}
        onChange={setChecked}
        label="Согласен на обработку персональных данных"
      />
      <Checkbox checked={false} onChange={() => {}} label="Не отмечен" />
      <Checkbox checked onChange={() => {}} label="Отмечен" />
      <Checkbox indeterminate onChange={() => {}} label="Частичный выбор" />
      <Checkbox
        checked={withError}
        onChange={setWithError}
        label={
          <span>
            Даю согласие на обработку персональных данных для связи со мной и записи на сервис в
            соответствии с Политикой конфиденциальности
          </span>
        }
        description="Отметьте, чтобы отправить заявку"
        error={withError ? undefined : 'Отметьте согласие, чтобы отправить заявку'}
      />
      <Checkbox checked={false} onChange={() => {}} disabled label="Недоступен" />
    </div>
  );
}

export const Default: Story = {
  render: () => <CheckboxPlayground />,
};

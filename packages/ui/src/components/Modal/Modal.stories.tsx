import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';

const meta = {
  title: 'Overlay/Modal',
  component: Modal,
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    open: true,
    onClose: () => {},
    title: 'Записаться',
    description: 'Перезвоним в течение часа в рабочее время',
    size: 'md',
    children: (
      <div className="flex flex-col gap-4">
        <Input label="Имя" placeholder="Как к вам обращаться" />
        <Input label="Телефон" placeholder="+375 29 000-00-00" type="tel" />
      </div>
    ),
    footer: <Button>Отправить</Button>,
  },
};

export const СlosesByTrigger: Story = {
  render: () => {
    const Component = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Открыть модалку</Button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Заказать звонок"
            description="Оставьте номер — перезвоним в рабочее время"
            size="sm"
          >
            <Input label="Телефон" placeholder="+375 29 000-00-00" type="tel" />
          </Modal>
        </>
      );
    };
    return <Component />;
  },
};

export const ExtraLarge: Story = {
  args: {
    open: true,
    onClose: () => {},
    title: 'Записаться',
    size: 'xl',
    children: (
      <div className="flex flex-col gap-4">
        <Input label="Имя" placeholder="Как к вам обращаться" />
        <Input label="Телефон" placeholder="+375 29 000-00-00" type="tel" />
      </div>
    ),
    footer: <Button>Отправить</Button>,
  },
};

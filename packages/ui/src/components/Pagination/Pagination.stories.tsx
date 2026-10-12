import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Pagination } from './Pagination';

const noop = () => undefined;

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof Pagination>;

export const FewPages: Story = {
  name: 'Мало страниц',
  render: () => {
    const [page, setPage] = useState(2);
    return <Pagination page={page} pageCount={3} onChange={setPage} />;
  },
};

export const ManyPages: Story = {
  name: 'Много страниц',
  render: () => {
    const [page, setPage] = useState(5);
    return <Pagination page={page} pageCount={12} onChange={setPage} />;
  },
};

export const FirstPage: Story = {
  name: 'Первая страница',
  render: () => <Pagination page={1} pageCount={8} onChange={noop} />,
};

export const LastPage: Story = {
  name: 'Последняя страница',
  render: () => <Pagination page={8} pageCount={8} onChange={noop} />,
};

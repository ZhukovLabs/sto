import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableBody, TableHead, TableHeadCell, TableRow, TableCell } from './Table';

const meta = {
  title: 'Data Display/Table',
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof Table>;

const rows = [
  { name: 'Замена масла и фильтров', price: 'от 15 руб.' },
  { name: 'Шиномонтаж', price: 'от 6 руб. /кол' },
  { name: 'Замена ремня ГРМ', price: '80–150 руб.' },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableHead>
        <TableRow className="hover:bg-transparent">
          <TableHeadCell>Услуга</TableHeadCell>
          <TableHeadCell className="text-right">Цена</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell className="text-right font-mono font-bold text-primary">
              {row.price}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';
import { Heading } from '../Heading/Heading';
import { Text } from '../Text/Text';
import { PriceTag } from '../PriceTag/PriceTag';

const meta = {
  title: 'Data Display/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    padding: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
    hoverable: { control: 'boolean' },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: { padding: 'md', children: 'Содержимое карточки' },
};

export const ServiceCardExample: Story = {
  render: () => (
    <div className="grid max-w-2xl grid-cols-2 gap-4">
      <Card hoverable>
        <div className="flex flex-col gap-3">
          <Text variant="label" color="accent">
            ПОСТ 1
          </Text>
          <Heading variant="h4">Масло и фильтры</Heading>
          <Text variant="body">По регламенту производителя, масло из вашего каталога.</Text>
          <PriceTag value="от 15 р" />
        </div>
      </Card>
      <Card hoverable>
        <div className="flex flex-col gap-3">
          <Text variant="label" color="accent">
            ПОСТ 2
          </Text>
          <Heading variant="h4">Диагностика</Heading>
          <Text variant="body">Считаем ошибки и объясняем, что они значат, а не пугаем.</Text>
          <PriceTag value="0 р" highlight />
        </div>
      </Card>
    </div>
  ),
};

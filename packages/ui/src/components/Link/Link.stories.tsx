import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from './Link';

const meta = {
  title: 'Actions/Link',
  component: Link,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['accent', 'underline', 'ghost'] },
    external: { control: 'boolean' },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: { variant: 'accent', href: '#', children: 'Заказать звонок' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Link variant="accent" href="#">
        +375 29 000-00-00
      </Link>
      <Link variant="underline" href="#">
        Политика обработки данных
      </Link>
      <Link variant="ghost" href="#">
        Услуги и цены
      </Link>
      <Link variant="accent" external href="https://t.me/maxshnaks_sto">
        @maxshnaks_sto
      </Link>
    </div>
  ),
};

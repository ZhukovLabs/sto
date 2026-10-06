import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container } from './Container';
import { Card } from '../Card/Card';
import { Text } from '../Text/Text';

const meta = {
  title: 'Layout/Container',
  component: Container,
  tags: ['autodocs'],
  argTypes: { size: { control: 'inline-radio', options: ['site', 'wide'] } },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof Container>;

export const Default: Story = {
  render: () => (
    <Container size="site">
      <Card padding="md">
        <Text variant="body-lg" color="strong">
          Контейнер site — 1200px, гаттеры 16/24/32px
        </Text>
      </Card>
    </Container>
  ),
};

export const Wide: Story = {
  render: () => (
    <Container size="wide">
      <Card padding="md">
        <Text variant="body-lg" color="strong">
          Контейнер wide — 1440px
        </Text>
      </Card>
    </Container>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { Text } from '../Text/Text';

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState('one');
      return (
        <Tabs value={value} onChange={setValue}>
          <TabsList>
            <TabsTrigger value="one">Перезвоните мне</TabsTrigger>
            <TabsTrigger value="two">Сам запишусь</TabsTrigger>
          </TabsList>
          <div className="mt-5">
            <TabsContent value="one">
              <Text variant="body" color="muted">
                Оставьте имя и номер — перезвоним в течение часа.
              </Text>
            </TabsContent>
            <TabsContent value="two">
              <Text variant="body" color="muted">
                Выберите дату и время — подтвердим запись звонком.
              </Text>
            </TabsContent>
          </div>
        </Tabs>
      );
    };
    return <Component />;
  },
};

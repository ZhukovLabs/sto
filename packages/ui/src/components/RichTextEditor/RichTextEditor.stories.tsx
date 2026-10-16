import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextEditor } from './RichTextEditor';

const meta = {
  title: 'Forms/RichTextEditor',
  component: RichTextEditor,
  tags: ['autodocs'],
} satisfies Meta<typeof RichTextEditor>;

export default meta;
type Story = StoryObj<typeof RichTextEditor>;

const INITIAL =
  '<h2>Зимняя подготовка</h2><p>Что проверить <strong>до морозов</strong>.</p><ul><li>Аккумулятор</li><li>Антифриз</li></ul>';

function Playground({ withImage = false }: { withImage?: boolean }): React.JSX.Element {
  const [html, setHtml] = useState(INITIAL);
  return (
    <div className="flex flex-col gap-4">
      <RichTextEditor
        label="Текст новости"
        helper="Поддерживаются заголовки, списки, ссылки и изображения"
        value={html}
        onChange={setHtml}
        {...(withImage
          ? {
              onUploadImage: async (file: File) =>
                new Promise<string>((resolve) => {
                  setTimeout(() => resolve(`https://picsum.photos/seed/${file.size}/640/360`), 600);
                }),
            }
          : {})}
      />
      <pre className="overflow-x-auto rounded-lg border border-border bg-panel-2/50 p-3 font-mono text-caption text-content-muted">
        {html}
      </pre>
    </div>
  );
}

export const Default: Story = {
  render: () => <Playground />,
};

export const WithImageUpload: Story = {
  render: () => <Playground withImage />,
};

export const Disabled: Story = {
  args: {
    label: 'Текст новости',
    value: INITIAL,
    onChange: () => {},
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Текст новости',
    value: INITIAL,
    onChange: () => {},
    error: 'Добавьте хотя бы абзац текста',
  },
};

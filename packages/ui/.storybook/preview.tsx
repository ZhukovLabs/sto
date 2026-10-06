import type { Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/fonts.css';
import './tailwind.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        Dark: 'dark',
        Light: 'light',
      },
      defaultTheme: 'Dark',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
    (Story) => (
      <div
        className="min-h-screen bg-bg p-8 text-body text-content"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;

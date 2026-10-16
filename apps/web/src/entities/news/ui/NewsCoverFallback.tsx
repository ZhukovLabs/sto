import { newsThemeIcon } from '../model/theme';

/**
 * Типографическая обложка для новости без фото: градиент из токенов ДС
 * и иконка темы, подобранная по заголовку и лиду.
 */
export function NewsCoverFallback({
  text,
  iconSize = 'size-10',
}: {
  text: string;
  iconSize?: string;
}): React.JSX.Element {
  const Icon = newsThemeIcon(text);
  return (
    <span className="flex size-full items-center justify-center bg-gradient-to-br from-panel-2 via-panel to-panel-2">
      <span className="flex items-center justify-center rounded-full border border-border bg-panel/70 p-4">
        <Icon className={`${iconSize} text-content-dim`} aria-hidden="true" />
      </span>
    </span>
  );
}

import type { ReactNode } from 'react';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom';
}

/**
 * Лёгкий CSS-тултип: показывается при наведении или фокусе внутри триггера.
 * Для доступности продублируйте полный текст в aria-label элемента.
 */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <span className="group relative inline-flex max-w-full">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-50 w-max max-w-xs -translate-x-1/2 rounded-md border border-border-strong bg-panel-2 px-2.5 py-1.5 text-caption leading-relaxed text-content [overflow-wrap:anywhere] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none ${
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}
      >
        {content}
      </span>
    </span>
  );
}

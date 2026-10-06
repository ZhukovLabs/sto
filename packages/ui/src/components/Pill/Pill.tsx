import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type PillSize = 'sm' | 'md';

export interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  size?: PillSize;
  children: ReactNode;
}

const sizeClass: Record<PillSize, string> = {
  sm: 'h-8 px-3 text-caption',
  md: 'h-10 px-4 text-body',
};

export function Pill({
  active = false,
  size = 'md',
  className = '',
  children,
  ...props
}: PillProps) {
  return (
    <button
      aria-pressed={active}
      className={[
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150',
        'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none',
        active
          ? 'bg-primary text-primary-ink'
          : 'bg-panel text-content-muted border border-border hover:border-border-strong hover:text-content',
        sizeClass[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

import type { HTMLAttributes } from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
}

const sizeClass: Record<SpinnerSize, string> = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-8 border-3',
};

export function Spinner({ size = 'md', className = '', ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Загрузка"
      className={[
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        sizeClass[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

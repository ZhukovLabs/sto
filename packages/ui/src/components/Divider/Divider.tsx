import type { HTMLAttributes, ReactNode } from 'react';

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: ReactNode;
}

export function Divider({
  orientation = 'horizontal',
  label,
  className = '',
  ...props
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={['bg-border h-full w-px', className].filter(Boolean).join(' ')}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        className={['flex w-full items-center gap-4', className].filter(Boolean).join(' ')}
        {...props}
      >
        <span className="h-px grow bg-border" />
        <span className="text-label font-semibold uppercase text-content-dim">{label}</span>
        <span className="h-px grow bg-border" />
      </div>
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={['bg-border h-px w-full', className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

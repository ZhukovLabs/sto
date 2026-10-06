import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'accent' | 'accent-soft' | 'neutral' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: ReactNode;
}

const variantClass: Record<BadgeVariant, string> = {
  accent: 'bg-accent-500 text-primary-ink',
  'accent-soft': 'bg-accent-500/12 text-accent-400 border border-accent-500/30',
  neutral: 'bg-panel-2 text-content-muted border border-border',
  success: 'bg-success-soft text-success border border-success/30',
  warning: 'bg-warning-soft text-warning border border-warning/30',
  danger: 'bg-danger-soft text-danger border border-danger/30',
};

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-caption gap-1.5',
  md: 'px-3 py-1 text-label gap-1.5',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-semibold',
        variantClass[variant],
        sizeClass[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {dot ? (
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  );
}

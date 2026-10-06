import type { ElementType, HTMLAttributes, ReactNode } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardVariant = 'panel' | 'panel-2' | 'ghost';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
  padding?: CardPadding;
  variant?: CardVariant;
  hoverable?: boolean;
  interactive?: boolean;
  children: ReactNode;
}

const paddingClass: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantClass: Record<CardVariant, string> = {
  panel: 'bg-panel border-border',
  'panel-2': 'bg-panel-2 border-border',
  ghost: 'bg-transparent border-border',
};

export function Card({
  as: Tag = 'div',
  padding = 'md',
  variant = 'panel',
  hoverable = false,
  interactive = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const lifted = interactive || hoverable;
  return (
    <Tag
      className={[
        'block border rounded-lg',
        variantClass[variant],
        lifted
          ? 'transition-all duration-200 ease-out hover:border-border-strong hover:shadow-md'
          : '',
        interactive
          ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/45 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none'
          : '',
        paddingClass[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </Tag>
  );
}

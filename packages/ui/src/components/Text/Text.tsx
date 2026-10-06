import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import type { TextColor } from '../Heading/Heading';

export type TextVariant = 'lead' | 'body-lg' | 'body' | 'caption' | 'label' | 'mono';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: TextVariant;
  color?: TextColor;
  truncate?: boolean;
  balance?: boolean;
  children: ReactNode;
}

const variantClass: Record<TextVariant, string> = {
  lead: 'text-lead font-normal',
  'body-lg': 'text-body-lg font-normal',
  body: 'text-body font-normal',
  caption: 'text-caption font-normal',
  label: 'text-label font-semibold uppercase',
  mono: 'text-mono font-mono font-normal',
};

const colorClass: Record<TextColor, string> = {
  strong: 'text-content',
  muted: 'text-content-muted',
  dim: 'text-content-dim',
  accent: 'text-primary',
  inherit: 'text-inherit',
};

export function Text({
  as: Tag = 'p',
  variant = 'body',
  color = 'muted',
  truncate = false,
  balance = false,
  className = '',
  children,
  ...props
}: TextProps) {
  return (
    <Tag
      className={[
        variantClass[variant],
        colorClass[color],
        truncate ? 'truncate' : '',
        balance ? 'text-balance' : '',
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

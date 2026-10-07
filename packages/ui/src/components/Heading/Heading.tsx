import type { ElementType, HTMLAttributes, ReactNode } from 'react';

export type HeadingVariant =
  | 'display-2xl'
  | 'display-xl'
  | 'display-lg'
  | 'section'
  | 'stat'
  | 'display-md'
  | 'display-sm'
  | 'display-xs'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4';

export type TextColor = 'strong' | 'muted' | 'dim' | 'accent' | 'inherit';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: ElementType;
  variant?: HeadingVariant;
  color?: TextColor;
  font?: 'display' | 'body';
  truncate?: boolean;
  balance?: boolean;
  children: ReactNode;
}

const variantClass: Record<HeadingVariant, string> = {
  'display-2xl': 'text-display-2xl font-extrabold',
  'display-xl': 'text-display-xl font-extrabold',
  'display-lg': 'text-display-lg font-extrabold',
  section: 'text-section font-bold',
  stat: 'text-stat font-bold',
  'display-md': 'text-display-md font-bold',
  'display-sm': 'text-display-sm font-extrabold',
  'display-xs': 'text-display-xs font-extrabold',
  h1: 'text-h1 font-bold',
  h2: 'text-h2 font-bold',
  h3: 'text-h3 font-semibold',
  h4: 'text-h4 font-semibold',
};

const colorClass: Record<TextColor, string> = {
  strong: 'text-content',
  muted: 'text-content-muted',
  dim: 'text-content-dim',
  accent: 'text-primary',
  inherit: 'text-inherit',
};

const defaultTag: Record<HeadingVariant, ElementType> = {
  'display-2xl': 'h1',
  'display-xl': 'h1',
  'display-lg': 'h1',
  section: 'h2',
  stat: 'p',
  'display-md': 'h1',
  'display-sm': 'h2',
  'display-xs': 'h2',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
};

export function Heading({
  as,
  variant = 'h2',
  color = 'strong',
  font = 'body',
  truncate = false,
  balance = false,
  className = '',
  children,
  ...props
}: HeadingProps) {
  const Tag = as ?? defaultTag[variant];
  return (
    <Tag
      className={[
        variantClass[variant],
        colorClass[color],
        font === 'display' ? 'font-display' : 'font-sans',
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

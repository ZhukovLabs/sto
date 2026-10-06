import type { HTMLAttributes } from 'react';

export type PriceTagSize = 'sm' | 'md' | 'lg';

export interface PriceTagProps extends HTMLAttributes<HTMLSpanElement> {
  value: string;
  prefix?: string;
  suffix?: string;
  oldValue?: string;
  size?: PriceTagSize;
  highlight?: boolean;
}

const sizeClass: Record<PriceTagSize, string> = {
  sm: 'text-h4',
  md: 'text-h3',
  lg: 'text-display-md',
};

const affixClass: Record<PriceTagSize, string> = {
  sm: 'text-caption',
  md: 'text-body',
  lg: 'text-h3',
};

export function PriceTag({
  value,
  prefix,
  suffix,
  oldValue,
  size = 'md',
  highlight = false,
  className = '',
  ...props
}: PriceTagProps) {
  return (
    <span
      className={[
        'inline-flex flex-wrap items-baseline gap-x-1.5 font-display font-bold',
        highlight ? 'text-primary' : 'text-content',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {oldValue ? (
        <span className="text-body font-medium text-content-dim line-through">{oldValue}</span>
      ) : null}
      {prefix ? (
        <span className={`font-body font-medium text-content-dim ${affixClass[size]}`}>
          {prefix}
        </span>
      ) : null}
      <span className={sizeClass[size]}>{value}</span>
      {suffix ? (
        <span className={`font-body font-medium text-content-muted ${affixClass[size]}`}>
          {suffix}
        </span>
      ) : null}
    </span>
  );
}

import type { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  variant?: 'pulse' | 'shimmer';
}

const roundedClass = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

export function Skeleton({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  variant = 'pulse',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const shimmer =
    variant === 'shimmer'
      ? 'animate-shimmer bg-gradient-to-r from-panel-2 via-panel to-panel-2 bg-[length:200%_100%]'
      : 'animate-pulse bg-panel-2';
  return (
    <div
      aria-hidden="true"
      className={[shimmer, roundedClass[rounded], className].filter(Boolean).join(' ')}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

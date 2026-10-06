import type { ElementType, HTMLAttributes, ReactNode } from 'react';

export type ContainerSize = 'narrow' | 'site' | 'wide' | 'full';

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: ContainerSize;
  children: ReactNode;
}

const sizeClass: Record<ContainerSize, string> = {
  narrow: 'max-w-3xl',
  site: 'max-w-(--container-site)',
  wide: 'max-w-(--container-wide)',
  full: 'max-w-none',
};

export function Container({
  as: Tag = 'div',
  size = 'site',
  className = '',
  children,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={['mx-auto w-full px-4 sm:px-6 lg:px-8', sizeClass[size], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </Tag>
  );
}

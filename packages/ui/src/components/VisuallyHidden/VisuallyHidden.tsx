import type { HTMLAttributes, ReactNode } from 'react';

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function VisuallyHidden({ children, ...props }: VisuallyHiddenProps) {
  return (
    <span className="sr-only" {...props}>
      {children}
    </span>
  );
}

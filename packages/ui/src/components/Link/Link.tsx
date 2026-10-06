import type { AnchorHTMLAttributes, ReactNode } from 'react';

export type LinkVariant = 'accent' | 'underline' | 'ghost';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: LinkVariant;
  external?: boolean;
  children: ReactNode;
}

const variantClass: Record<LinkVariant, string> = {
  accent: 'text-primary font-semibold hover:text-primary-hover',
  underline:
    'text-content underline decoration-border-strong underline-offset-4 hover:text-primary',
  ghost: 'text-content-muted hover:text-content',
};

export function Link({
  variant = 'accent',
  external = false,
  className = '',
  children,
  ...props
}: LinkProps) {
  return (
    <a
      className={[
        'inline-flex cursor-pointer items-center gap-1 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:rounded-sm focus-visible:outline-none',
        variantClass[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    >
      {children}
      {external ? (
        <span aria-hidden="true" className="text-sm">
          ↗
        </span>
      ) : null}
    </a>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '../Spinner/Spinner';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
}

const variantClass: Record<IconButtonVariant, string> = {
  primary: 'bg-primary text-primary-ink hover:bg-primary-hover active:bg-primary-active',
  secondary:
    'bg-panel text-content border border-border hover:border-border-strong hover:bg-panel-2',
  ghost: 'bg-transparent text-content-muted hover:text-content hover:bg-panel',
};

const sizeClass: Record<IconButtonSize, string> = {
  sm: 'size-9 rounded-md',
  md: 'size-11 rounded-lg',
  lg: 'size-14 rounded-lg',
};

export function IconButton({
  label,
  icon,
  variant = 'secondary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={[
        'inline-flex cursor-pointer items-center justify-center transition-all duration-150 ease-out active:translate-y-px',
        'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
        variantClass[variant],
        sizeClass[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon}
    </button>
  );
}

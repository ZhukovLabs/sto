import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '../Spinner/Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
};

export type ButtonProps = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> &
  ({ href?: undefined } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>);

export type ButtonLinkProps = ButtonBaseProps & { href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    'href'
  >;

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-ink font-semibold hover:bg-primary-hover active:bg-primary-active active:translate-y-px hover:shadow-md',
  secondary:
    'bg-panel text-content font-medium border border-border hover:border-border-strong hover:bg-panel-2 active:translate-y-px',
  outline:
    'bg-transparent text-content font-medium border border-border hover:border-border-strong hover:bg-panel active:translate-y-px',
  ghost:
    'bg-transparent text-content-muted font-medium hover:text-content hover:bg-panel active:translate-y-px',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 gap-2 text-body',
  md: 'h-12 px-5 gap-2 text-body-lg',
  lg: 'h-14 px-6 gap-3 text-body-lg',
};

const radiusClass: Record<ButtonSize, string> = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-lg',
};

function buttonClasses(props: ButtonBaseProps & { className?: string; fullWidth?: boolean }) {
  const {
    variant = 'primary',
    size = 'md',
    pill = false,
    fullWidth = false,
    className = '',
  } = props;
  return [
    'inline-flex cursor-pointer items-center justify-center whitespace-nowrap transition-all duration-150 ease-out',
    'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none',
    variantClass[variant],
    sizeClass[size],
    pill ? 'rounded-full' : radiusClass[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Button(props: ButtonProps | ButtonLinkProps) {
  const {
    variant = 'primary',
    size = 'md',
    pill = false,
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className = '',
    children,
    disabled,
    ...rest
  } = props as ButtonProps & Partial<ButtonLinkProps>;
  const href = (props as Partial<ButtonLinkProps>).href;

  const inner = (
    <>
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );

  if (href !== undefined) {
    const anchorProps = rest as unknown as Record<string, unknown>;
    delete anchorProps.type;
    delete anchorProps.form;
    delete anchorProps.disabled;
    return (
      <a
        href={href}
        aria-busy={loading || undefined}
        className={buttonClasses({ variant, size, pill, fullWidth, className })}
        {...anchorProps}
      >
        {inner}
      </a>
    );
  }

  const buttonProps = rest as unknown as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      className={buttonClasses({ variant, size, pill, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...buttonProps}
    >
      {inner}
    </button>
  );
}

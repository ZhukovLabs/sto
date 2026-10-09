'use client';

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange'
> {
  label?: ReactNode;
  description?: ReactNode;
  error?: string;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({
  label,
  description,
  error,
  indeterminate = false,
  className = '',
  id,
  checked,
  onChange,
  disabled,
  ...props
}: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const describedBy =
    [description ? `${inputId}-desc` : undefined, error ? errorId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3">
        <span className="relative mt-px inline-flex size-[18px] shrink-0">
          <input
            id={inputId}
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange?.(event.target.checked)}
            disabled={disabled}
            ref={(node) => {
              if (node) node.indeterminate = indeterminate;
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={[
              'peer size-[18px] shrink-0 cursor-pointer appearance-none rounded-[5px] border-[1.5px] bg-panel',
              'border-border transition-colors duration-150 hover:border-border-strong',
              'checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary',
              'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border',
              error ? 'border-danger' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            className="pointer-events-none absolute inset-0 m-auto size-3 text-primary-ink opacity-0 transition-opacity peer-checked:opacity-100 peer-indeterminate:opacity-0 peer-disabled:opacity-0"
          >
            <path
              d="m3.5 8.5 3 3 6-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            className="pointer-events-none absolute inset-0 m-auto size-3 text-primary-ink opacity-0 transition-opacity peer-indeterminate:opacity-100 peer-disabled:opacity-0"
          >
            <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        {label ? (
          <span className="flex min-w-0 flex-col gap-1 text-sm leading-snug text-content">
            {label}
            {description ? (
              <span id={`${inputId}-desc`} className="text-micro text-content-dim">
                {description}
              </span>
            ) : null}
          </span>
        ) : null}
      </label>
      {error ? (
        <span id={errorId} className="pl-[30px] text-caption text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}

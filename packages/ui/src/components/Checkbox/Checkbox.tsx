import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
  indeterminate?: boolean;
}

export function Checkbox({
  label,
  description,
  error,
  indeterminate = false,
  className = '',
  id,
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
      <div className="flex items-start gap-3">
        <span className="relative inline-flex shrink-0">
          <input
            id={inputId}
            type="checkbox"
            ref={(node) => {
              if (node) node.indeterminate = indeterminate;
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={[
              'peer mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-sm border bg-panel',
              'border-border transition-colors duration-150',
              'checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary',
              'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
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
            className="pointer-events-none absolute inset-0 mt-0.5 size-5 text-primary-ink opacity-0 transition-opacity peer-checked:opacity-100 peer-disabled:opacity-0"
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
            className="pointer-events-none absolute inset-0 mt-0.5 size-5 text-primary-ink opacity-0 peer-indeterminate:opacity-100 peer-disabled:opacity-0"
          >
            <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span className="flex flex-col gap-0.5">
          <label
            htmlFor={inputId}
            className="cursor-pointer select-none text-body text-content-muted"
          >
            {label}
          </label>
          {description ? (
            <span id={`${inputId}-desc`} className="text-caption text-content-dim">
              {description}
            </span>
          ) : null}
        </span>
      </div>
      {error ? (
        <span id={errorId} className="text-caption text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}

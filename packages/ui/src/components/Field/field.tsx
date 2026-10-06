import type { ReactNode } from 'react';

export type FieldSize = 'sm' | 'md' | 'lg';

export const fieldControlClass = (error?: string) =>
  [
    'w-full bg-panel border px-4 text-content placeholder:text-content-dim transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-bg',
    'disabled:cursor-not-allowed disabled:opacity-50',
    error
      ? 'border-danger hover:border-danger'
      : 'border-border hover:border-border-strong focus:border-primary',
  ].join(' ');

export function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-label font-semibold uppercase text-content">
      {label}
      {required ? (
        <span aria-hidden="true" className="ml-0.5 text-primary">
          *
        </span>
      ) : null}
    </label>
  );
}

export function FieldCaption({
  error,
  helper,
  errorId,
  helperId,
}: {
  error?: string;
  helper?: string;
  errorId: string;
  helperId: string;
}) {
  if (error) {
    return (
      <span id={errorId} className="text-caption text-danger">
        {error}
      </span>
    );
  }
  if (helper) {
    return (
      <span id={helperId} className="text-caption text-content-dim">
        {helper}
      </span>
    );
  }
  return null;
}

export function fieldCaptionIds(id: string) {
  return { helperId: `${id}-helper`, errorId: `${id}-error` };
}

export const fieldDescribedBy = (
  error: string | undefined,
  helper: string | undefined,
  errorId: string,
  helperId: string,
) => (error ? errorId : helper ? helperId : undefined) as string | undefined;

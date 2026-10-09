import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import {
  FieldCaption,
  FieldLabel,
  fieldCaptionIds,
  fieldControlClass,
  fieldDescribedBy,
  type FieldSize,
} from '../Field/field';

export type { FieldSize };

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helper?: ReactNode;
  error?: ReactNode;
  size?: FieldSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeClass: Record<FieldSize, string> = {
  sm: 'h-10 text-body rounded-md',
  md: 'h-12 text-body-lg rounded-lg',
  lg: 'h-14 text-body-lg rounded-lg',
};

const padClass = (left?: ReactNode, right?: ReactNode) => ({
  'pl-10': Boolean(left),
  'pr-10': Boolean(right),
});

export function Input({
  label,
  helper,
  error,
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  id,
  required,
  ...props
}: InputProps) {
  const inputId = id ?? useId();
  const { helperId, errorId } = fieldCaptionIds(inputId);

  return (
    <div className="flex w-full flex-col gap-2">
      {label ? <FieldLabel htmlFor={inputId} label={label} required={required} /> : null}
      <div className="relative">
        {leftIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-content-dim"
          >
            {leftIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(error, helper, errorId, helperId)}
          className={[
            fieldControlClass(error),
            sizeClass[size],
            padClass(leftIcon, rightIcon),
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {rightIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-content-dim"
          >
            {rightIcon}
          </span>
        ) : null}
      </div>
      <FieldCaption error={error} helper={helper} errorId={errorId} helperId={helperId} />
    </div>
  );
}

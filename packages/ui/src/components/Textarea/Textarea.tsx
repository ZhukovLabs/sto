'use client';

import { useEffect, useId, useState, type ReactNode, type TextareaHTMLAttributes } from 'react';
import {
  FieldCaption,
  FieldLabel,
  fieldCaptionIds,
  fieldControlClass,
  fieldDescribedBy,
  type FieldSize,
} from '../Field/field';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: ReactNode;
  error?: ReactNode;
  size?: FieldSize;
}

const sizeClass: Record<FieldSize, string> = {
  sm: 'text-body rounded-md min-h-20 p-3',
  md: 'text-body-lg rounded-lg min-h-28 px-4 py-3',
  lg: 'text-body-lg rounded-lg min-h-36 px-4 py-3',
};

export function Textarea({
  label,
  helper,
  error,
  size = 'md',
  rows,
  className = '',
  id,
  required,
  maxLength,
  value,
  defaultValue,
  onInput,
  ...props
}: TextareaProps) {
  const textareaId = id ?? useId();
  const { helperId, errorId } = fieldCaptionIds(textareaId);
  const [textLength, setTextLength] = useState(() =>
    typeof value === 'string'
      ? value.length
      : typeof defaultValue === 'string'
        ? defaultValue.length
        : 0,
  );

  useEffect(() => {
    if (typeof value === 'string') setTextLength(value.length);
  }, [value]);

  const showCounter = typeof maxLength === 'number';
  const caption = (
    <FieldCaption error={error} helper={helper} errorId={errorId} helperId={helperId} />
  );

  return (
    <div className="flex w-full flex-col gap-2">
      {label ? <FieldLabel htmlFor={textareaId} label={label} required={required} /> : null}
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(error, helper, errorId, helperId)}
        className={[fieldControlClass(error), 'resize-y', sizeClass[size], className]
          .filter(Boolean)
          .join(' ')}
        onInput={(event) => {
          setTextLength(event.currentTarget.value.length);
          onInput?.(event);
        }}
        {...props}
      />
      {showCounter || caption ? (
        <div className="flex items-baseline justify-between gap-2">
          {caption}
          {showCounter ? (
            <span className="ml-auto shrink-0 self-end text-caption text-content-dim">
              {textLength}/{maxLength}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

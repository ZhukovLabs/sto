import { useId, type TextareaHTMLAttributes } from 'react';
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
  helper?: string;
  error?: string;
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
  ...props
}: TextareaProps) {
  const textareaId = id ?? useId();
  const { helperId, errorId } = fieldCaptionIds(textareaId);

  return (
    <div className="flex w-full flex-col gap-2">
      {label ? <FieldLabel htmlFor={textareaId} label={label} required={required} /> : null}
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(error, helper, errorId, helperId)}
        className={[fieldControlClass(error), 'resize-y', sizeClass[size], className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      <FieldCaption error={error} helper={helper} errorId={errorId} helperId={helperId} />
    </div>
  );
}

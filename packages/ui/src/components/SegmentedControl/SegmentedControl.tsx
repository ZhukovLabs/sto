'use client';

import { useId, type KeyboardEvent, type ReactNode } from 'react';

export interface SegmentedControlItem {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedControlProps {
  items: SegmentedControlItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  'aria-label': string;
}

export function SegmentedControl({
  items,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps) {
  const baseId = useId();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = buttons[(index + delta + buttons.length) % buttons.length];
    if (!next) return;
    next.focus();
    onChange(next.dataset.value ?? '');
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={`inline-flex gap-1 rounded-lg border border-border bg-panel p-1 ${className ?? ''}`}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            data-value={item.value}
            aria-pressed={active}
            id={`${baseId}-${item.value}`}
            onClick={() => onChange(item.value)}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-md px-3 font-mono text-caption uppercase tracking-[0.08em] transition-colors motion-reduce:transition-none ${
              active
                ? 'bg-primary text-primary-ink'
                : 'text-content-muted hover:bg-panel-2 hover:text-content'
            }`}
          >
            {item.icon ? (
              <span aria-hidden="true" className="flex shrink-0">
                {item.icon}
              </span>
            ) : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

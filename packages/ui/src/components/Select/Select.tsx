import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type SelectHTMLAttributes,
} from 'react';
import {
  FieldCaption,
  FieldLabel,
  fieldCaptionIds,
  fieldDescribedBy,
  type FieldSize,
} from '../Field/field';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLDivElement>,
  'children' | 'size' | 'onChange' | 'value'
> {
  options: SelectOption[];
  label?: string;
  helper?: string;
  error?: string;
  placeholder?: string;
  size?: FieldSize;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

const sizeClass: Record<FieldSize, string> = {
  sm: 'h-10 text-body rounded-md',
  md: 'h-12 text-body-lg rounded-lg',
  lg: 'h-14 text-body-lg rounded-lg',
};

const popupClass: Record<FieldSize, string> = {
  sm: 'text-body',
  md: 'text-body',
  lg: 'text-body-lg',
};

export function Select({
  options,
  label,
  helper,
  error,
  placeholder,
  size = 'md',
  value: controlledValue,
  defaultValue,
  onChange,
  className = '',
  id,
  required,
  disabled,
  name,
  ...props
}: SelectProps) {
  const selectId = id ?? useId();
  const listboxId = `${selectId}-listbox`;
  const { helperId, errorId } = fieldCaptionIds(selectId);

  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue ?? (placeholder ? '' : (options[0]?.value ?? '')),
  );
  const value = controlledValue ?? uncontrolledValue;
  const selected = options.find((option) => option.value === value);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option.value === value),
    ),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ size: number; pos: number } | null>(null);

  const measureThumb = () => {
    const el = listRef.current;
    if (!el) return;
    const { scrollHeight, clientHeight, scrollTop } = el;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll < 4) {
      setThumb(null);
      return;
    }
    const size = Math.max(
      32,
      Math.min((clientHeight / scrollHeight) * clientHeight, clientHeight - 24),
    );
    const pos = maxScroll > 0 ? (scrollTop / maxScroll) * (clientHeight - size) : 0;
    setThumb({ size, pos });
  };

  useLayoutEffect(() => {
    if (open) measureThumb();
  }, [open, options.length]);

  const selectableIndexes = options
    .map((option, index) => (option.disabled ? -1 : index))
    .filter((index) => index >= 0);
  const selectableCount = selectableIndexes.length;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const option = document.getElementById(`${listboxId}-option-${activeIndex}`);
    if (!list || !option) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
    }
  }, [activeIndex, open, listboxId]);

  const commit = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    setUncontrolledValue(option.value);
    onChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveActive = (direction: 1 | -1) => {
    if (!selectableCount) return;
    const current = selectableIndexes.indexOf(activeIndex);
    const next =
      current === -1
        ? direction > 0
          ? selectableIndexes[0]
          : selectableIndexes[selectableIndexes.length - 1]
        : selectableIndexes[(current + direction + selectableCount) % selectableCount];
    setActiveIndex(next);
  };

  const openList = (preferEnd = false) => {
    const firstSelectable = selectableIndexes[0];
    const lastSelectable = selectableIndexes[selectableIndexes.length - 1];
    setActiveIndex(
      selected
        ? options.indexOf(selected)
        : preferEnd
          ? (lastSelectable ?? firstSelectable ?? 0)
          : (firstSelectable ?? 0),
    );
    setOpen(true);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) commit(activeIndex);
        else openList();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openList(true);
        else moveActive(-1);
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          setActiveIndex(selectableIndexes[0] ?? 0);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setActiveIndex(selectableIndexes[selectableIndexes.length - 1] ?? options.length - 1);
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  const triggerClasses = [
    'relative w-full appearance-none bg-panel border px-4 pr-10 text-left text-content transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-bg',
    'disabled:cursor-not-allowed disabled:opacity-50',
    error
      ? 'border-danger hover:border-danger'
      : 'border-border hover:border-border-strong focus:border-primary',
    sizeClass[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={rootRef}
      className="relative flex w-full min-w-40 flex-col gap-2"
      onKeyDown={onKeyDown}
      {...props}
    >
      {label ? <FieldLabel htmlFor={selectId} label={label} required={required} /> : null}
      {name && value !== undefined ? <input type="hidden" name={name} value={value} /> : null}
      <div className="relative">
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(error, helper, errorId, helperId)}
          aria-required={required || undefined}
          disabled={disabled}
          className={triggerClasses}
          onClick={() => (open ? setOpen(false) : openList())}
        >
          <span className="absolute inset-y-0 right-10 left-4 flex items-center">
            <span className={`block truncate ${selected ? '' : 'text-content-dim'}`}>
              {selected ? selected.label : (placeholder ?? '')}
            </span>
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            className={`pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-content-dim transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          >
            <path
              d="m4 6 4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open ? (
          <div
            className={`absolute top-full left-0 z-40 mt-2 w-full overflow-hidden rounded-lg border border-border bg-panel p-1.5 shadow-lg ${popupClass[size]}`}
          >
            <div
              id={listboxId}
              role="listbox"
              aria-labelledby={label ? selectId : undefined}
              ref={listRef}
              onScroll={measureThumb}
              className="max-h-60 overflow-y-auto overscroll-contain pr-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {placeholder ? (
                <div
                  id={`${listboxId}-option--1`}
                  role="option"
                  aria-selected={!selected}
                  className="cursor-pointer rounded-md px-3 py-2 text-content-dim hover:bg-panel-2"
                  onClick={() => {
                    setUncontrolledValue('');
                    onChange?.('');
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  {placeholder}
                </div>
              ) : null}
              {options.map((option, index) => {
                const isSelected = selected?.value === option.value;
                return (
                  <div
                    key={option.value}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    className={[
                      'flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2',
                      option.disabled
                        ? 'cursor-not-allowed text-content-dim opacity-50'
                        : 'text-content',
                      activeIndex === index ? 'bg-panel-2' : '',
                      isSelected ? 'font-semibold' : '',
                      'hover:bg-panel-2',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                    onClick={() => commit(index)}
                  >
                    <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                      {option.label}
                    </span>
                    {isSelected ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="size-4 shrink-0 text-primary"
                      >
                        <path
                          d="m3.5 8.5 3 3 6-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {thumb ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-1.5 right-1.5 w-1.5"
              >
                <div
                  className="w-full rounded-full bg-[#3A3F46]"
                  style={{ height: thumb.size, transform: `translateY(${thumb.pos}px)` }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <FieldCaption error={error} helper={helper} errorId={errorId} helperId={helperId} />
    </div>
  );
}

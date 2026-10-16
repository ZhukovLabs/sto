'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@sto/ui';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  'aria-label': string;
}

/** Поисковое поле тулбара админки: лупа слева, крестик очистки справа. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  'aria-label': ariaLabel,
}: SearchInputProps) {
  return (
    <div className="relative w-full sm:max-w-64">
      <Input
        size="sm"
        leftIcon={<Search className="size-4" aria-hidden="true" />}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="w-full"
      />
      {value !== '' ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Очистить поиск"
          className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-content-dim transition-colors hover:bg-panel-2 hover:text-content"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

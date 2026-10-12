import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '../IconButton/IconButton';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  'aria-label'?: string;
}

function pageList(page: number, pageCount: number): (number | 'ellipsis-l' | 'ellipsis-r')[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis-l' | 'ellipsis-r')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) {
    pages.push('ellipsis-l');
  }
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }
  if (end < pageCount - 1) {
    pages.push('ellipsis-r');
  }
  pages.push(pageCount);
  return pages;
}

/** Постраничная навигация: назад/вперёд, номера страниц, многоточия для длинных списков. */
export function Pagination({
  page,
  pageCount,
  onChange,
  'aria-label': ariaLabel = 'Постраничная навигация',
}: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }
  const safePage = Math.min(Math.max(1, page), pageCount);
  return (
    <nav aria-label={ariaLabel} className="flex items-center gap-1">
      <IconButton
        variant="ghost"
        size="sm"
        label="Предыдущая страница"
        icon={<ChevronLeft size={16} strokeWidth={1.8} />}
        disabled={safePage <= 1}
        onClick={() => onChange(safePage - 1)}
      />
      {pageList(safePage, pageCount).map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            aria-current={item === safePage ? 'page' : undefined}
            onClick={() => onChange(item)}
            className={`h-9 min-w-9 rounded-md px-2 font-mono text-caption transition-colors ${
              item === safePage
                ? 'bg-primary font-bold text-primary-ink'
                : 'text-content-muted hover:bg-panel-2 hover:text-content'
            }`}
          >
            {item}
          </button>
        ) : (
          <span key={item} aria-hidden className="px-1 text-content-dim">
            …
          </span>
        ),
      )}
      <IconButton
        variant="ghost"
        size="sm"
        label="Следующая страница"
        icon={<ChevronRight size={16} strokeWidth={1.8} />}
        disabled={safePage >= pageCount}
        onClick={() => onChange(safePage + 1)}
      />
    </nav>
  );
}

import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Визуально скрытый заголовок навигации для скринридеров. */
  label?: string;
  className?: string;
}

const linkClass = 'text-caption text-content-dim transition-colors hover:text-content';

export function Breadcrumbs({ items, label = 'Хлебные крошки', className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={`min-w-0 ${className}`}>
      <ol className="flex min-w-0 items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${item.href ?? item.label}-${index}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {index > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-content-dim"
                  strokeWidth={2}
                />
              )}
              {item.href !== undefined && !isLast ? (
                <a href={item.href} className={`truncate ${linkClass}`}>
                  {item.label}
                </a>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={`truncate text-caption ${isLast ? 'text-content-muted' : ''}`}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

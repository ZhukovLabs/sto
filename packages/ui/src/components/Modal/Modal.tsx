'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  footer?: ReactNode;
  /** Дополнительно к панели: например, фиксированная высота (sm:h-[…]). */
  className?: string;
  children: ReactNode;
}

const sizeClass: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Совпадает с длительностью --animate-sheet-out / --animate-modal-out / --animate-fade-out. */
const CLOSE_ANIMATION_MS = 250;

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  className,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [closing, setClosing] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }
    setClosing(true);
    const timer = setTimeout(() => setRendered(false), CLOSE_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open || !rendered) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const { overflow, paddingRight } = document.documentElement.style;
    document.documentElement.style.overflow = 'hidden';
    if (scrollbar > 0) {
      document.documentElement.style.paddingRight = `${scrollbar}px`;
    }

    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const initial = focusables()[0];
    if (initial) {
      initial.focus();
    } else {
      panel?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.documentElement.style.overflow = overflow;
      document.documentElement.style.paddingRight = paddingRight;
      previouslyFocused?.focus();
    };
  }, [open, rendered]);

  if (!rendered || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-(--z-modal) flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-(--color-overlay) ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-xl border border-border bg-panel-2 sm:rounded-xl ${
          closing
            ? 'max-sm:animate-sheet-out sm:animate-modal-out'
            : 'max-sm:animate-sheet-in sm:animate-modal-in'
        } ${sizeClass[size]} ${className ?? ''}`}
      >
        <div
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border-strong sm:hidden"
        />
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-4 sm:px-7 sm:pt-6">
          <div className="flex flex-col gap-1.5">
            <h2
              id={titleId}
              className="font-display text-body-lg font-bold uppercase tracking-[0.02em] text-content"
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-body text-content-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="-mt-[7px] -mr-1 flex size-10 shrink-0 items-center justify-center rounded-md text-content-dim transition-colors hover:bg-panel hover:text-content motion-reduce:transition-none"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="scroll-slim flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-3 pb-7 sm:px-7 sm:pt-5">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-border bg-panel-2 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-7 sm:pb-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

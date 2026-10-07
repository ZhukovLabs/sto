'use client';

import { createContext, useContext, useId, type KeyboardEvent, type ReactNode } from 'react';

interface TabsContextValue {
  value: string;
  baseId: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tabs-компоненты используются вне <Tabs>');
  return context;
}

export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

export function Tabs({ value, onChange, children }: TabsProps) {
  const baseId = useId();
  return (
    <TabsContext.Provider value={{ value, baseId, onChange }}>{children}</TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex gap-1 rounded-lg border border-border bg-panel p-1 ${className ?? ''}`}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: selected, baseId, onChange } = useTabs();
  const active = selected === value;
  const id = `${baseId}-tab-${value.replace(/\s+/g, '_')}`;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const buttons = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    const index = buttons.indexOf(event.currentTarget);
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = buttons[(index + delta + buttons.length) % buttons.length];
    if (!next) return;
    next.focus();
    onChange(next.dataset.value ?? '');
  };

  return (
    <button
      type="button"
      role="tab"
      data-value={value}
      id={id}
      aria-selected={active}
      aria-controls={`${baseId}-panel-${value.replace(/\s+/g, '_')}`}
      tabIndex={active ? 0 : -1}
      onClick={() => onChange(value)}
      onKeyDown={onKeyDown}
      className={`h-9 flex-1 rounded-md px-4 font-mono text-caption uppercase tracking-[0.08em] transition-colors motion-reduce:transition-none ${
        active
          ? 'bg-primary text-primary-ink'
          : 'text-content-muted hover:bg-panel-2 hover:text-content'
      } ${className ?? ''}`}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: ReactNode;
}

export function TabsContent({ value, children }: TabsContentProps) {
  const { value: selected, baseId } = useTabs();
  if (selected !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value.replace(/\s+/g, '_')}`}
      aria-labelledby={`${baseId}-tab-${value.replace(/\s+/g, '_')}`}
      tabIndex={0}
      className="animate-fade-in focus-visible:outline-none"
    >
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';
import { Text } from '@sto/ui';

export interface EmptyStateProps {
  title: ReactNode;
  hint?: ReactNode;
  /** Кнопка-действие (CTA) под текстом. */
  action?: ReactNode;
}

/** Пустое состояние в пунктирной панели — единый вид списков админки. */
export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong px-6 py-12 text-center">
      <Text variant="body" color="muted">
        {title}
      </Text>
      {hint !== undefined ? (
        <Text variant="caption" color="dim" className="mt-1.5 block">
          {hint}
        </Text>
      ) : null}
      {action !== undefined ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

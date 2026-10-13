'use client';

import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Таб, синхронизированный с ?tab= в адресе: адрес обновляется мгновенно
 * (replaceState, без перезагрузки), ссылками можно делиться, F5 сохраняет таб.
 */
export function useUrlTab(
  defaultTab: string,
  allowed: readonly string[],
): readonly [string, (value: string) => void] {
  const initial = allowed.includes(defaultTab) ? defaultTab : (allowed[0] ?? '');
  const [tab, setTab] = useState(initial);
  const pathname = usePathname();
  const onChange = useCallback(
    (value: string) => {
      setTab(value);
      window.history.replaceState(null, '', `${pathname}?tab=${value}`);
    },
    [pathname],
  );
  return [tab, onChange] as const;
}

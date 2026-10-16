'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { SITE_INFO_FALLBACK } from '../api';
import type { SiteInfo } from '../model/types';

const SiteInfoContext = createContext<SiteInfo>(SITE_INFO_FALLBACK);

/** Кладётся в корневом layout: один серверный fetch — телефон и часы доступны всем клиентским виджетам. */
export function SiteInfoProvider({ info, children }: { info: SiteInfo; children: ReactNode }) {
  return <SiteInfoContext.Provider value={info}>{children}</SiteInfoContext.Provider>;
}

export function useSiteInfo(): SiteInfo {
  return useContext(SiteInfoContext);
}

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sto/ui';
import { MastersTable } from '@/features/masters-admin';
import { useUrlTab } from '@/shared/lib/use-url-tab';
import { TeamAdmin } from './TeamAdmin';

const TABS = [
  { value: 'site', label: 'На сайте' },
  { value: 'telegram', label: 'Telegram' },
] as const;

/** Раздел «Команда»: состав для сайта и мастера-получатели заявок в Telegram. Таб — в URL (?tab=). */
export function TeamTabs({ initialTab = 'site' }: { initialTab?: string }): React.JSX.Element {
  const [tab, setTab] = useUrlTab(
    initialTab,
    TABS.map((t) => t.value),
  );
  return (
    <Tabs value={tab} onChange={setTab}>
      <TabsList aria-label="Разделы команды">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="site">
        <TeamAdmin />
      </TabsContent>
      <TabsContent value="telegram">
        <MastersTable />
      </TabsContent>
    </Tabs>
  );
}

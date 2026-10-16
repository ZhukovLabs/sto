'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sto/ui';
import { BookingSettingsForm } from '@/features/booking-settings';
import { NotificationSettingsForm } from '@/features/notifications';
import { SiteSettingsForm } from '@/features/site-settings';
import { useUrlTab } from '@/shared/lib/use-url-tab';

const TABS = [
  { value: 'booking', label: 'Запись' },
  { value: 'notifications', label: 'Уведомления' },
  { value: 'site', label: 'Сайт' },
] as const;

/** Раздел «Настройки»: расписание записи, каналы уведомлений и контакты сайта. Таб — в URL (?tab=). */
export function SettingsTabs({
  initialTab = 'booking',
}: {
  initialTab?: string;
}): React.JSX.Element {
  const [tab, setTab] = useUrlTab(
    initialTab,
    TABS.map((t) => t.value),
  );
  return (
    <Tabs value={tab} onChange={setTab}>
      <TabsList aria-label="Разделы настроек">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="booking">
        <BookingSettingsForm />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationSettingsForm />
      </TabsContent>
      <TabsContent value="site">
        <SiteSettingsForm />
      </TabsContent>
    </Tabs>
  );
}

import { cookies } from 'next/headers';
import { AppShell } from '@/widgets/app-shell';
import { SESSION_COOKIE, apiCountNewRequests, apiCountUnconfirmedBookings } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? '';

  const [newRequests, unconfirmedBookings] = await Promise.all([
    apiCountNewRequests(token).catch(() => null),
    apiCountUnconfirmedBookings(token).catch(() => null),
  ]);
  const badge =
    newRequests === null && unconfirmedBookings === null
      ? null
      : (newRequests ?? 0) + (unconfirmedBookings ?? 0);

  return (
    <AppShell user={user} badge={badge}>
      {children}
    </AppShell>
  );
}

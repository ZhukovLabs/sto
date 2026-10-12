import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowRight, PhoneCall, Wrench } from 'lucide-react';
import { Heading, Text } from '@sto/ui';
import {
  SESSION_COOKIE,
  REQUEST_STATUS_LABELS,
  apiCountNewRequests,
  apiCountUnconfirmedBookings,
  apiListBookings,
  apiListRequests,
  isRequestStatus,
} from '@/lib/api';

export const metadata = { title: 'Панель управления — ПроМакс' };

interface FeedItem {
  id: string;
  kind: 'request' | 'booking';
  name: string;
  phone: string;
  detail: string;
  createdAt: Date;
  badge: string | null;
  hot: boolean;
}

function timeLabel(date: Date, now: Date): string {
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export default async function AdminHomePage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? '';

  const [requests, bookings, newRequests, unconfirmedBookings] = await Promise.all([
    apiListRequests(token).catch(() => null),
    apiListBookings(token).catch(() => null),
    apiCountNewRequests(token).catch(() => null),
    apiCountUnconfirmedBookings(token).catch(() => null),
  ]);
  const online = requests !== null || bookings !== null;
  const now = new Date();

  const feed: FeedItem[] = [
    ...(requests ?? []).map((request) => ({
      id: request.id,
      kind: 'request' as const,
      name: request.name,
      phone: request.phone,
      detail: request.comment ?? 'перезвонить',
      createdAt: new Date(request.createdAt),
      badge: isRequestStatus(request.status) ? REQUEST_STATUS_LABELS[request.status] : null,
      hot: request.status === 'new',
    })),
    ...(bookings ?? []).map((booking) => ({
      id: booking.id,
      kind: 'booking' as const,
      name: booking.name,
      phone: booking.phone,
      detail: [booking.services.join(', '), booking.car].filter(Boolean).join(' · '),
      createdAt: new Date(booking.createdAt),
      badge: booking.status === 'unconfirmed' ? 'ждёт подтверждения' : 'запись',
      hot: booking.status === 'unconfirmed',
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  const todayBookings = (bookings ?? [])
    .filter((booking) => new Date(booking.scheduledAt).toDateString() === now.toDateString())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Text variant="caption" color="dim" className="font-mono uppercase tracking-[0.14em]">
            {now.toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              timeZone: 'Europe/Minsk',
            })}
          </Text>
          <Heading font="display" variant="display-sm" className="mt-3 uppercase">
            Смена сегодня
          </Heading>
        </div>
        <span className="flex items-center gap-2.5 pb-1.5">
          <span
            className={`size-2 rounded-full ${online ? 'bg-success' : 'bg-danger'}`}
            aria-hidden
          />
          <Text variant="caption" color="dim" className="font-mono uppercase tracking-[0.08em]">
            {online ? 'api на связи' : 'нет связи с сервером'}
          </Text>
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-border pb-3">
            <Heading font="display" variant="h4" className="uppercase">
              Что происходит
            </Heading>
            <Link
              href="/requests"
              className="group flex items-center gap-2 font-mono text-caption uppercase tracking-[0.1em] text-content-dim transition-colors hover:text-primary"
            >
              все обращения
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {feed.length === 0 ? (
            <Text variant="body" color="dim" className="py-10 text-center">
              {online ? 'Обращений пока нет — тишина в цехе' : 'Не удалось загрузить обращения'}
            </Text>
          ) : (
            <ul>
              {feed.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href="/requests"
                    className="group flex items-center gap-4 border-b border-border py-4 transition-colors"
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-lg border ${
                        item.hot
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border bg-panel text-content-dim'
                      }`}
                    >
                      {item.kind === 'request' ? (
                        <PhoneCall size={16} strokeWidth={1.8} />
                      ) : (
                        <Wrench size={16} strokeWidth={1.8} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-3">
                        <span className="truncate text-body font-semibold text-content">
                          {item.name}
                        </span>
                        <span className="font-mono text-caption text-content-dim">
                          {item.phone}
                        </span>
                        {item.badge ? (
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-micro uppercase ${
                              item.hot
                                ? 'bg-primary/15 text-primary'
                                : 'bg-panel-2 text-content-dim'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-caption text-content-muted">
                        {item.detail}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-caption text-content-dim">
                      {timeLabel(item.createdAt, now)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col rounded-xl border border-border bg-panel p-5">
              <Text variant="micro" color="dim" className="font-mono uppercase tracking-[0.12em]">
                новые заявки
              </Text>
              <span
                className={`mt-auto block pt-2 font-display text-display-md font-bold leading-none tabular-nums ${
                  newRequests ? 'text-primary' : 'text-content'
                }`}
              >
                {newRequests ?? '—'}
              </span>
            </div>
            <div className="flex flex-col rounded-xl border border-border bg-panel p-5">
              <Text variant="micro" color="dim" className="font-mono uppercase tracking-[0.12em]">
                ждут подтверждения
              </Text>
              <span
                className={`mt-auto block pt-2 font-display text-display-md font-bold leading-none tabular-nums ${
                  unconfirmedBookings ? 'text-primary' : 'text-content'
                }`}
              >
                {unconfirmedBookings ?? '—'}
              </span>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-panel p-5">
            <Text variant="micro" color="dim" className="font-mono uppercase tracking-[0.12em]">
              сегодня в записи
            </Text>
            {todayBookings.length === 0 ? (
              <Text variant="caption" color="muted" className="mt-3 block">
                {bookings === null ? 'Нет связи' : 'Записей на сегодня нет'}
              </Text>
            ) : (
              <ul className="mt-3 flex flex-col gap-2.5">
                {todayBookings.slice(0, 4).map((booking) => (
                  <li key={booking.id} className="flex items-baseline gap-3">
                    <span className="font-mono text-caption font-semibold text-primary">
                      {new Date(booking.scheduledAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-caption text-content">
                      {booking.name}
                    </span>
                    <span className="hidden truncate font-mono text-micro text-content-dim sm:inline sm:max-w-[9rem]">
                      {booking.services[0] ?? ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {todayBookings.length > 4 ? (
              <Link
                href="/requests"
                className="mt-3 block font-mono text-micro uppercase tracking-[0.1em] text-content-dim transition-colors hover:text-primary"
              >
                ещё {todayBookings.length - 4} →
              </Link>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

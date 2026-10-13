'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Input, Text } from '@sto/ui';
import { apiGet, apiSend } from '@/shared/api/client';
import { prettyPhone } from '@/shared/lib/phone';
import type { SiteSettingsRow } from '@/lib/api';

const SITE_SETTINGS_KEY = ['site-settings'] as const;

/** Те же правила, что в api (parsePublicPhone): канонический вид для dirty-сравнения. */
function canonicalPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('80') && digits.length === 11) {
    digits = `375${digits.slice(2)}`;
  }
  return digits === '' ? '' : `+${digits}`;
}

/** Число из поля координаты (запятая тоже допустима) либо null. */
function parseCoordInput(raw: string, min: number, max: number): number | null {
  const num = Number(raw.trim().replace(',', '.'));
  return raw.trim() !== '' && Number.isFinite(num) && num >= min && num <= max ? num : null;
}

interface SavePatch {
  phone?: string;
  address?: string;
  unp?: string;
  lat?: string;
  lon?: string;
}

export function SiteSettingsForm(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [unp, setUnp] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const settings = useQuery({
    queryKey: SITE_SETTINGS_KEY,
    queryFn: () => apiGet<SiteSettingsRow>('/api/site-settings', 'Не удалось загрузить настройки'),
  });

  // Рефетч (фокус окна, invalidate после сохранения) не должен затирать правки:
  // каждое поле синхронизируется, только пока админ его не трогал.
  useEffect(() => {
    if (settings.data === undefined) {
      return;
    }
    if (!phoneDirty) {
      setPhone(settings.data.phone === null ? '' : prettyPhone(settings.data.phone));
    }
    if (!addressDirty) {
      setAddress(settings.data.address ?? '');
    }
    if (!unpDirty) {
      setUnp(settings.data.unp ?? '');
    }
    if (!latDirty) {
      setLat(settings.data.lat === null ? '' : String(settings.data.lat));
    }
    if (!lonDirty) {
      setLon(settings.data.lon === null ? '' : String(settings.data.lon));
    }
    // Политика «не затирать правки»: dirty-флаги здесь намеренно не в deps.
  }, [settings.data]);

  const save = useMutation({
    mutationFn: (patch: SavePatch) =>
      apiSend('/api/site-settings', 'PUT', patch, 'Не удалось сохранить'),
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: SITE_SETTINGS_KEY });
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message);
    },
  });

  useEffect(() => {
    if (!saved) {
      return;
    }
    const timer = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(timer);
  }, [saved]);

  const phoneDirty = canonicalPhone(phone) !== (settings.data?.phone ?? '');
  const addressDirty = address.trim() !== (settings.data?.address ?? '');
  const unpDirty = unp.trim() !== (settings.data?.unp ?? '');
  const latDirty = lat.trim() !== (settings.data?.lat === null ? '' : String(settings.data?.lat));
  const lonDirty = lon.trim() !== (settings.data?.lon === null ? '' : String(settings.data?.lon));
  const dirty = phoneDirty || addressDirty || unpDirty || latDirty || lonDirty;

  const previewLat = parseCoordInput(lat, -90, 90);
  const previewLon = parseCoordInput(lon, -180, 180);

  // Дебаунс координат превью: без него iframe карты перезагружается на каждый символ.
  const [debouncedLat, setDebouncedLat] = useState<number | null>(null);
  const [debouncedLon, setDebouncedLon] = useState<number | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLat(previewLat);
      setDebouncedLon(previewLon);
    }, 500);
    return () => clearTimeout(timer);
  }, [previewLat, previewLon]);

  const submit = (): void => {
    const patch: SavePatch = {};
    if (phoneDirty) {
      // Пустое поле - осознанный сброс: сайт покажет фолбэк-контакт.
      if (phone.trim() === '') {
        patch.phone = '';
      } else {
        const digits = phone.trim().replace(/\D/g, '');
        if (digits.length < 9 || digits.length > 15) {
          setError('Телефон: 9–15 цифр, например +375 29 000-00-00');
          return;
        }
        patch.phone = phone.trim();
      }
    }
    if (addressDirty) {
      const clean = address.trim();
      if (clean !== '' && (clean.length < 2 || clean.length > 200)) {
        setError('Адрес: от 2 до 200 символов (пусто — показать заглушку)');
        return;
      }
      patch.address = clean;
    }
    if (unpDirty) {
      const digits = unp.trim().replace(/\D/g, '');
      if (unp.trim() !== '' && digits.length !== 9) {
        setError('УНП: 9 цифр (пусто — показать статический)');
        return;
      }
      patch.unp = unp.trim();
    }
    if (latDirty || lonDirty) {
      const cleanLat = lat.trim();
      const cleanLon = lon.trim();
      if ((cleanLat === '') !== (cleanLon === '')) {
        setError('Широта и долгота задаются вместе');
        return;
      }
      if (
        cleanLat !== '' &&
        (parseCoordInput(cleanLat, -90, 90) === null ||
          parseCoordInput(cleanLon, -180, 180) === null)
      ) {
        setError('Координаты: широта от −90 до 90, долгота от −180 до 180');
        return;
      }
      patch.lat = cleanLat;
      patch.lon = cleanLon;
    }
    save.mutate(patch);
  };

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-border bg-panel p-6 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="flex flex-col gap-5">
          <Input
            id="site-phone"
            label="Телефон на сайте"
            placeholder="+375 29 000-00-00"
            inputMode="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setError(null);
            }}
          />
          <Input
            id="site-address"
            label="Адрес"
            placeholder="Гомель, ул. Интернациональная 5"
            maxLength={200}
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              setError(null);
            }}
          />
          <Input
            id="site-unp"
            label="УНП"
            placeholder="390000000"
            inputMode="numeric"
            maxLength={20}
            value={unp}
            onChange={(event) => {
              setUnp(event.target.value);
              setError(null);
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="site-lat"
              label="Широта"
              placeholder="52.4345"
              inputMode="decimal"
              value={lat}
              onChange={(event) => {
                setLat(event.target.value);
                setError(null);
              }}
            />
            <Input
              id="site-lon"
              label="Долгота"
              placeholder="30.9754"
              inputMode="decimal"
              value={lon}
              onChange={(event) => {
                setLon(event.target.value);
                setError(null);
              }}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <span className="font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
            Точка на карте
          </span>
          {debouncedLat !== null && debouncedLon !== null ? (
            <div className="h-80 overflow-hidden rounded-lg border border-border">
              <iframe
                src={`https://yandex.ru/map-widget/v1/?ll=${debouncedLon}%2C${debouncedLat}&z=16&pt=${debouncedLon},${debouncedLat},pm2orgm`}
                title="Точка на карте по введённым координатам"
                loading="lazy"
                className="h-80 w-full border-0"
              />
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong px-6 text-center">
              <Text variant="body" color="muted">
                Введите широту и долготу — здесь появится предпросмотр точки.
              </Text>
              <Text variant="caption" color="dim">
                Точка используется маркером на главной, «Контактах» и ссылкой «маршрут»
              </Text>
            </div>
          )}
        </div>
      </div>

      {settings.isError ? (
        <Text variant="caption" className="text-danger">
          {settings.error instanceof Error
            ? settings.error.message
            : 'Не удалось загрузить настройки'}
        </Text>
      ) : null}
      {error !== null ? (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      ) : null}

      <div className="flex items-center gap-3 border-t border-border pt-5">
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={save.isPending}
          disabled={!dirty}
          onClick={submit}
        >
          Сохранить
        </Button>
        {saved ? (
          <Badge variant="success" size="sm" dot>
            сохранено · веб обновится сам
          </Badge>
        ) : null}
      </div>
    </section>
  );
}

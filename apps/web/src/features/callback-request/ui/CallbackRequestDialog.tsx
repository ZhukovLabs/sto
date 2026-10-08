'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  getBookingDates,
  getBookingSettings,
  getBookingSlots,
  submitBookingRequest,
  submitCallbackRequest,
  type BookingSettings,
} from '@/entities/booking';
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Modal,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@/shared/ui';
import { site } from '@/shared/config/site';

type Mode = 'callback' | 'booking';
type Status = 'idle' | 'submitting' | 'success' | 'error';

interface FormState {
  name: string;
  phone: string;
  car: string;
  date: string;
  time: string;
}

const EMPTY_FORM: FormState = { name: '', phone: '', car: '', date: '', time: '' };
const PHONE_DIGITS_MIN = 9;
const PHONE_DIGITS_MAX = 12;
const NAME_MIN_LENGTH = 2;

const phoneDigits = (phone: string) => phone.replace(/\D/g, '');

function validate(form: FormState, mode: Mode): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (form.name.trim().length < NAME_MIN_LENGTH) {
    errors.name = 'Введите имя — минимум две буквы';
  }
  const digits = phoneDigits(form.phone);
  if (digits.length < PHONE_DIGITS_MIN || digits.length > PHONE_DIGITS_MAX) {
    errors.phone = 'Введите телефон в формате +375 XX XXX-XX-XX';
  }
  if (mode === 'booking') {
    if (!form.date) errors.date = 'Выберите день — откройте календарь';
    if (!form.time) errors.time = 'Выберите время из списка';
  }
  return errors;
}

function ContactFields({
  form,
  errors,
  onChange,
}: {
  form: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  onChange: (key: keyof FormState) => (value: string) => void;
}) {
  return (
    <>
      <Input
        label="Имя"
        placeholder="Как к вам обращаться"
        value={form.name}
        onChange={(event) => onChange('name')(event.target.value)}
        error={errors.name}
      />
      <Input
        label="Телефон"
        type="tel"
        placeholder="+375 29 000-00-00"
        value={form.phone}
        onChange={(event) => onChange('phone')(event.target.value)}
        error={errors.phone}
      />
    </>
  );
}

export function CallbackRequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('callback');
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setStatus('idle');
    setErrors({});
    getBookingSettings().then((next) => {
      if (active) setSettings(next);
    });
    return () => {
      active = false;
    };
  }, [open]);

  const dates = useMemo(() => (settings ? getBookingDates(settings) : []), [settings]);
  const slots = useMemo(
    () => (settings && form.date ? getBookingSlots(settings, form.date) : []),
    [settings, form.date],
  );

  useEffect(() => {
    if (!dates.length || (form.date && !dates.find((d) => d.iso === form.date)?.disabled)) return;
    const firstEnabled = dates.find((d) => !d.disabled);
    setForm((prev) => ({ ...prev, date: firstEnabled?.iso ?? '' }));
  }, [dates, form.date]);

  const selectedDate = dates.find((d) => d.iso === form.date);

  useEffect(() => {
    if (!slots.length) return;
    const stillValid = slots.find((s) => s.label === form.time && !s.disabled);
    if (!stillValid) {
      const firstEnabled = slots.find((s) => !s.disabled);
      setForm((prev) => ({ ...prev, time: firstEnabled?.label ?? '' }));
    }
  }, [slots, form.time]);

  const set = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const callbackMutation = useMutation({ mutationFn: submitCallbackRequest });
  const bookingMutation = useMutation({ mutationFn: submitBookingRequest });

  const submit = async () => {
    const nextErrors = validate(form, mode);
    setErrors(nextErrors);
    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (!consent) {
      setConsentError('Отметьте согласие — без него мы не можем принять заявку');
    }
    if (!consent || hasErrors) return;
    setStatus('submitting');
    const idempotencyKey = crypto.randomUUID();
    const promise =
      mode === 'callback'
        ? callbackMutation.mutateAsync({
            request: {
              name: form.name.trim(),
              phone: phoneDigits(form.phone),
            },
            idempotencyKey,
          })
        : bookingMutation.mutateAsync({
            name: form.name.trim(),
            phone: phoneDigits(form.phone),
            car: form.car.trim() || undefined,
            date: form.date,
            time: form.time,
            idempotencyKey,
          });
    try {
      await promise;
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const close = () => {
    onClose();
    setForm(EMPTY_FORM);
    setMode('callback');
    setStatus('idle');
    setConsent(false);
    setConsentError(null);
  };

  if (status === 'success') {
    return (
      <Modal open={open} onClose={close} title="Заявка принята" size="sm">
        <div className="flex flex-col gap-4">
          <Text variant="body-lg" color="muted">
            {mode === 'callback' ? (
              `Перезвоним в течение часа в рабочее время (${site.hours.short}).`
            ) : (
              <>
                Ждём вас {selectedDate?.label ?? form.date} к {form.time}. Окончательно подтвердим
                запись звонком на{' '}
                <span className="whitespace-nowrap text-content">{form.phone.trim()}</span>.
              </>
            )}
          </Text>
          <Button onClick={close}>Готово</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Записаться"
      description={`${site.city} · ${site.hours.label}`}
      footer={
        <div className="flex flex-col gap-4">
          <Checkbox
            checked={consent}
            onChange={(next) => {
              setConsent(next);
              setConsentError(null);
            }}
            label={
              <>
                Согласен(на) на обработку персональных данных — имя, телефон и данные записи.{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-content underline decoration-border-strong underline-offset-2 hover:decoration-primary"
                >
                  Политика конфиденциальности
                </a>
              </>
            }
            error={consentError ?? undefined}
          />
          <Button size="lg" className="w-full" loading={status === 'submitting'} onClick={submit}>
            {mode === 'callback' ? 'Ждать звонка' : 'Записаться'}
          </Button>
          {status === 'error' ? (
            <Text variant="caption" className="text-danger">
              Не получилось отправить заявку. Проверьте связь и попробуйте ещё раз.
            </Text>
          ) : (
            <Text variant="caption" color="dim">
              {mode === 'callback'
                ? 'Перезвоним в течение часа в рабочее время и подберём удобное окно.'
                : 'Время предварительное — подтвердим звонком. Приезжайте к назначенному часу.'}
            </Text>
          )}
        </div>
      }
    >
      <Tabs value={mode} onChange={(value) => setMode(value as Mode)}>
        <TabsList className="w-full">
          <TabsTrigger value="callback">Перезвоните мне</TabsTrigger>
          <TabsTrigger value="booking">Сам запишусь</TabsTrigger>
        </TabsList>

        <div className="mt-5 flex flex-col gap-4">
          <TabsContent value="callback">
            <div className="flex flex-col gap-4">
              <ContactFields form={form} errors={errors} onChange={set} />
            </div>
          </TabsContent>

          <TabsContent value="booking">
            <div className="flex flex-col gap-4">
              <ContactFields form={form} errors={errors} onChange={set} />
              <Input
                label="Авто (необязательно)"
                placeholder="Марка и модель"
                value={form.car}
                onChange={(event) => set('car')(event.target.value)}
              />

              <DatePicker
                label="Дата"
                value={form.date}
                onChange={set('date')}
                error={errors.date}
                min={dates[0]?.iso}
                max={dates[dates.length - 1]?.iso}
                isDateDisabled={(iso) => dates.find((date) => date.iso === iso)?.disabled ?? false}
              />
              {selectedDate?.note ? (
                <Text variant="caption" color="dim">
                  {selectedDate.weekdayLabel}: {selectedDate.note}
                </Text>
              ) : null}

              <div className="flex flex-col gap-2">
                <span className="text-label font-semibold uppercase text-content">Время</span>
                <div role="radiogroup" aria-label="Время записи" className="grid grid-cols-5 gap-2">
                  {slots.map((slot) => {
                    const selected = slot.label === form.time;
                    return (
                      <button
                        key={slot.label}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-disabled={slot.disabled}
                        onClick={() => !slot.disabled && set('time')(slot.label)}
                        className={`h-10 rounded-lg border-[1.5px] font-mono text-caption tracking-[0.06em] transition-colors motion-reduce:transition-none ${
                          slot.disabled
                            ? 'cursor-not-allowed border-transparent bg-panel text-content-dim opacity-55'
                            : selected
                              ? 'border-primary bg-primary font-semibold text-primary-ink'
                              : 'border-transparent bg-panel text-content hover:border-primary'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
                {errors.time ? (
                  <Text variant="caption" className="text-danger">
                    {errors.time}
                  </Text>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Modal>
  );
}

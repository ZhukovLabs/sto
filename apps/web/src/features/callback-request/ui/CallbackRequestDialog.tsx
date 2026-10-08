'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SmartCaptcha } from '@yandex/smart-captcha';
import {
  getBookingDates,
  getBookingSlots,
  submitBookingRequest,
  submitCallbackRequest,
  type BookingDateOption,
  type BookingSlot,
} from '@/entities/booking';
import { getServices } from '@/entities/service';
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Modal,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@/shared/ui';
import { site } from '@/shared/config/site';
import { isBelarusMobilePhone, looksLikeBelarusPhone } from '@/shared/lib/phone';
import { AntiAbuseRequiredError } from '@/shared/lib/anti-abuse';

type Mode = 'callback' | 'booking';
type Status = 'idle' | 'submitting' | 'success' | 'error';

interface FormState {
  name: string;
  phone: string;
  company: string;
  car: string;
  services: string[];
  comment: string;
  date: string;
  time: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  phone: '',
  company: '',
  car: '',
  services: [],
  comment: '',
  date: '',
  time: '',
};
const phoneDigits = (phone: string) => phone.replace(/\D/g, '');
const NAME_MIN_LENGTH = 2;

function validate(
  form: FormState,
  mode: Mode,
): Partial<Record<keyof FormState, ReactNode>> {
  const errors: Partial<Record<keyof FormState, ReactNode>> = {};
  const name = form.name.trim();
  if (name.length === 0) {
    errors.name = 'Впишите имя';
  } else if (name.length < NAME_MIN_LENGTH) {
    errors.name = 'Имя слишком короткое';
  }
  if (!isBelarusMobilePhone(form.phone)) {
    errors.phone = looksLikeBelarusPhone(form.phone)
      ? 'Номер неполный — пример: +375 29 123-45-67'
      : [
          'Нужен белорусский номер. Или позвоните нам: ',
          <a
            key="tel"
            href={`tel:${site.phones[0].value}`}
            className="underline underline-offset-2"
          >
            {site.phones[0].pretty}
          </a>,
        ];
  }  if (mode === 'booking') {
    if (!form.date) errors.date = 'Выберите день визита';
    if (!form.time) errors.time = 'Выберите время';
  }
  return errors;
}

function ContactFields({
  form,
  errors,
  onChange,
}: {
  form: FormState;
  errors: Partial<Record<keyof FormState, ReactNode>>;
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
      {/* Honeypot: невидимо для людей, заполняют только боты. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] size-px opacity-0"
        value={form.company}
        onChange={(event) => onChange('company')(event.target.value)}
      />
    </>
  );
}

export function CallbackRequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('callback');
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, ReactNode>>>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [dates, setDates] = useState<BookingDateOption[]>([]);
  const [datesError, setDatesError] = useState<string | null>(null);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slotsPending, setSlotsPending] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getServices().then((services) => {
      if (!active) return;
      setServiceOptions([...services.map((service) => service.title), 'Другое']);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setStatus('idle');
    setErrors({});
    setDatesError(null);
    setCaptchaRequired(false);
    getBookingDates()
      .then((next) => {
        if (active) setDates(next);
      })
      .catch((error: Error) => {
        if (active) setDatesError(error.message);
      });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!dates.length || (form.date && !dates.find((d) => d.iso === form.date)?.disabled)) return;
    const firstEnabled = dates.find((d) => !d.disabled);
    setForm((prev) => ({ ...prev, date: firstEnabled?.iso ?? '' }));
  }, [dates, form.date]);

  const selectedDate = dates.find((d) => d.iso === form.date);

  useEffect(() => {
    if (!form.date) return;
    let active = true;
    setSlotsPending(true);
    getBookingSlots(form.date)
      .then((next) => {
        if (active) setSlots(next);
      })
      .catch(() => {
        if (active) setSlots([]);
      })
      .finally(() => {
        if (active) setSlotsPending(false);
      });
    return () => {
      active = false;
    };
  }, [form.date]);

  useEffect(() => {
    if (slotsPending || !slots.length) return;
    const stillValid = slots.find((s) => s.label === form.time && !s.disabled);
    if (!stillValid) {
      const firstEnabled = slots.find((s) => !s.disabled);
      setForm((prev) => ({ ...prev, time: firstEnabled?.label ?? '' }));
    }
  }, [slots, slotsPending, form.time]);

  const set =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const callbackMutation = useMutation({ mutationFn: submitCallbackRequest });
  const bookingMutation = useMutation({ mutationFn: submitBookingRequest });

  const submit = async (captchaToken?: string | null) => {
    const nextErrors = validate(form, mode);
    setErrors(nextErrors);
    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (!consent) {
      setConsentError('Отметьте согласие, чтобы отправить заявку');
    }
    if (!consent || hasErrors) return;
    setStatus('submitting');
    setCaptchaRequired(false);
    setErrorMessage(null);
    const idempotencyKey = crypto.randomUUID();
    const promise =
      mode === 'callback'
        ? callbackMutation.mutateAsync({
            request: {
              name: form.name.trim(),
              phone: phoneDigits(form.phone),
              ...(form.company?.trim() ? { company: form.company.trim() } : {}),
            },
            idempotencyKey,
            captchaToken,
          })
        : bookingMutation.mutateAsync({
            request: {
              name: form.name.trim(),
              phone: phoneDigits(form.phone),
              ...(form.company?.trim() ? { company: form.company.trim() } : {}),
              ...(form.car.trim() === '' ? {} : { car: form.car.trim() }),
              ...(form.services.length === 0 ? {} : { services: form.services }),
              ...(form.comment.trim() === '' ? {} : { comment: form.comment.trim() }),
              date: form.date,
              time: form.time,
              idempotencyKey,
            },
            captchaToken,
          });
    try {
      await promise;
      setStatus('success');
    } catch (error: unknown) {
      if (error instanceof AntiAbuseRequiredError) {
        setCaptchaRequired(true);
        setStatus('idle');
        return;
      }
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : 'Не получилось отправить заявку. Проверьте связь и попробуйте ещё раз.',
      );
      setStatus('error');
    }
  };

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaRequired(false);
    void submit(token);
  };

  const close = () => {
    onClose();
    setForm(EMPTY_FORM);
    setMode('callback');
    setStatus('idle');
    setConsent(false);
    setConsentError(null);
    setCaptchaRequired(false);
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
          {captchaRequired ? (
            <div className="flex flex-col gap-2.5 rounded-lg border-[1.5px] border-dashed border-border-strong p-4">
              <Text variant="mono" color="dim" className="uppercase tracking-[0.08em]">
                Проверка: подозрительно много отправок
              </Text>
              <SmartCaptcha
                sitekey={process.env.NEXT_PUBLIC_SMARTCAPTCHA_SITEKEY ?? ''}
                onSuccess={handleCaptchaSuccess}
              />
              <Text variant="caption" color="dim">
                Пройдите проверку — и заявка уйдёт сама.
              </Text>
            </div>
          ) : null}
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
          <Button
            size="lg"
            className="w-full"
            loading={status === 'submitting'}
            onClick={() => void submit()}
          >
            {mode === 'callback' ? 'Ждать звонка' : 'Записаться'}
          </Button>
          {status === 'error' && errorMessage ? (
            <Text variant="caption" className="text-danger">
              {errorMessage}
            </Text>
          ) : status === 'error' ? (
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
              <Select
                multiple
                label="Услуги (необязательно)"
                placeholder="Выберите услуги"
                options={serviceOptions.map((option) => ({ value: option, label: option }))}
                value={form.services}
                onChange={set('services')}
              />
              <Input
                label="Комментарий (необязательно)"
                placeholder="Что беспокоит — пара слов"
                value={form.comment}
                onChange={(event) => set('comment')(event.target.value)}
              />

              {datesError ? (
                <Text variant="caption" className="text-danger">
                  {datesError}
                </Text>
              ) : (
                <DatePicker
                  label="Дата"
                  value={form.date}
                  onChange={set('date')}
                  error={errors.date}
                  min={dates[0]?.iso}
                  max={dates[dates.length - 1]?.iso}
                  isDateDisabled={(iso) => dates.find((date) => date.iso === iso)?.disabled ?? false}
                />
              )}

              <div className="flex flex-col gap-2">
                <span className="text-label font-semibold uppercase text-content">Время</span>
                {slotsPending ? (
                  <Text variant="caption" color="dim">
                    Загружаем свободные часы…
                  </Text>
                ) : slots.length === 0 ? (
                  <Text variant="caption" color="dim">
                    На этот день свободных часов нет — выберите другую дату.
                  </Text>
                ) : (
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
                )}
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

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
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
import { fetchServiceTitles } from '@/entities/service';
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
  Textarea,
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
  phone: '+375 ',
  company: '',
  car: '',
  services: [],
  comment: '',
  date: '',
  time: '',
};
const phoneDigits = (phone: string) => phone.replace(/\D/g, '');

/** Нестираемый «+» в начале поля телефона; остальное (375, номер) редактируется свободно. */
function normalizePhoneInput(raw: string): string {
  return raw.startsWith('+') ? raw : `+${raw}`;
}
/** Ключ идемпотентности из getRandomValues: доступен и вне secure context (HTTP в LAN). */
function newIdempotencyKey(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
const NAME_MIN_LENGTH = 2;
/** Фиксированная высота диалога: форма записи не прыгает при переключении табов. */
const DIALOG_HEIGHT = 'h-[92dvh] sm:h-[864px]';

function validate(form: FormState, mode: Mode): Partial<Record<keyof FormState, ReactNode>> {
  const errors: Partial<Record<keyof FormState, ReactNode>> = {};
  const name = form.name.trim();
  if (name.length === 0) {
    errors.name = 'Впишите имя';
  } else if (name.length < NAME_MIN_LENGTH) {
    errors.name = 'Имя слишком короткое';
  }
  if (phoneDigits(form.phone).length <= 3) {
    errors.phone = 'Укажите телефон — перезвоним в течение часа';
  } else if (!isBelarusMobilePhone(form.phone)) {
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
  }
  if (mode === 'booking') {
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
        onChange={(event) => onChange('phone')(normalizePhoneInput(event.target.value))}
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

export function CallbackRequestDialog({
  open,
  onClose,
  preselectedService = null,
}: {
  open: boolean;
  onClose: () => void;
  /** Название услуги из каталога — подставляется в форму и включает режим записи */
  preselectedService?: string | null;
}) {
  const [mode, setMode] = useState<Mode>('callback');
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, ReactNode>>>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const updateScrollHint = () => {
    const el = contentRef.current;
    const thumb = thumbRef.current;
    if (!el || !thumb) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 8) {
      thumb.style.height = '100%';
      thumb.style.top = '0%';
      setHasScroll(false);
      setCanScrollDown(false);
      return;
    }
    const height = Math.max(12, (clientHeight / scrollHeight) * 100);
    const top = Math.min((scrollTop / scrollHeight) * 100, 100 - height);
    thumb.style.height = `${height}%`;
    thumb.style.top = `${top}%`;
    setHasScroll(true);
    setCanScrollDown(top + height < 99.5);
  };

  const attachContentRef = (el: HTMLDivElement | null) => {
    contentRef.current = el;
    resizeObserverRef.current?.disconnect();
    if (el && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateScrollHint());
      observer.observe(el);
      resizeObserverRef.current = observer;
    }
  };

  const [dates, setDates] = useState<BookingDateOption[]>([]);
  const [datesError, setDatesError] = useState<string | null>(null);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slotsPending, setSlotsPending] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    updateScrollHint();
  });

  useEffect(() => {
    let active = true;
    fetchServiceTitles()
      .then((titles) => {
        if (!active) return;
        setServiceOptions(titles);
      })
      .catch(() => {
        if (active) setServiceOptions(['Другое']);
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
    setSlotsError(null);
    setCaptchaRequired(false);
    if (preselectedService) {
      setMode('booking');
      setForm((prev) => ({
        ...prev,
        services: prev.services.includes(preselectedService) ? prev.services : [preselectedService],
      }));
    }
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
  }, [open, preselectedService]);

  useEffect(() => {
    if (!form.date) return;
    if (dates.find((d) => d.iso === form.date)?.disabled) {
      setForm((prev) => ({ ...prev, date: '' }));
    }
  }, [dates, form.date]);

  const selectedDate = dates.find((d) => d.iso === form.date);

  useEffect(() => {
    if (!form.date) return;
    let active = true;
    setSlotsPending(true);
    setSlotsError(null);
    getBookingSlots(form.date)
      .then((next) => {
        if (active) setSlots(next);
      })
      .catch((error: Error) => {
        if (active) setSlotsError(error.message);
      })
      .finally(() => {
        if (active) setSlotsPending(false);
      });
    return () => {
      active = false;
    };
  }, [form.date]);

  useEffect(() => {
    if (slotsPending || !form.time) return;
    const stillValid = slots.find((s) => s.label === form.time && !s.disabled);
    if (!stillValid) {
      setForm((prev) => ({ ...prev, time: '' }));
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
    const idempotencyKey = newIdempotencyKey();
    const promise =
      mode === 'callback'
        ? callbackMutation.mutateAsync({
            request: {
              name: form.name.trim(),
              phone: phoneDigits(form.phone),
              ...(form.comment.trim() === '' ? {} : { comment: form.comment.trim() }),
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

  const isFormDirty =
    form.name.trim() !== '' ||
    phoneDigits(form.phone).length > 3 ||
    form.comment.trim() !== '' ||
    form.car.trim() !== '' ||
    form.services.length > 0 ||
    form.date !== '' ||
    form.time !== '';

  const close = () => {
    onClose();
    setForm(EMPTY_FORM);
    setMode('callback');
    setStatus('idle');
    setConsent(false);
    setConsentError(null);
    setCaptchaRequired(false);
  };

  const requestClose = () => {
    if (status === 'submitting') return;
    if (status !== 'success' && isFormDirty) {
      setConfirmClose(true);
      return;
    }
    close();
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
    <>
      <Modal
        open={open}
        onClose={requestClose}
        title="Записаться"
        size="xl"
        className={DIALOG_HEIGHT}
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
                <span className="text-balance text-content-dim">
                  Даю согласие на&nbsp;обработку персональных данных для&nbsp;связи со&nbsp;мной
                  и&nbsp;записи на&nbsp;сервис в&nbsp;соответствии с&nbsp;
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-content underline decoration-border-strong underline-offset-2 hover:decoration-primary"
                  >
                    Политикой конфиденциальности
                  </a>
                  .
                </span>
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
            ) : null}
          </div>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <Tabs
            value={mode}
            onChange={(value) => {
              setMode(value as Mode);
              setErrors({});
              setErrorMessage(null);
              setConsentError(null);
            }}
          >
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="callback">Перезвоните мне</TabsTrigger>
              <TabsTrigger value="booking">Сам запишусь</TabsTrigger>
            </TabsList>

            <div className="relative mt-5 flex min-h-0 flex-1 flex-col">
              <div
                ref={attachContentRef}
                onScroll={updateScrollHint}
                className="scroll-slim -ml-1.5 -mr-3 flex flex-col gap-4 pl-1.5 pr-3 sm:-mr-5.5 sm:pr-4 overflow-y-auto"
              >
                <TabsContent value="callback">
                  <div className="flex flex-col gap-4 pb-4 sm:pb-0">
                    <ContactFields form={form} errors={errors} onChange={set} />
                    <Textarea
                      label="Комментарий (необязательно)"
                      placeholder="Что беспокоит, удобное время для звонка — пара слов"
                      rows={6}
                      maxLength={500}
                      value={form.comment}
                      onChange={(event) => set('comment')(event.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="booking">
                  <div className="flex flex-col gap-4 pb-4 sm:pb-0">
                    <ContactFields form={form} errors={errors} onChange={set} />

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
                        isDateDisabled={(iso) =>
                          dates.find((date) => date.iso === iso)?.disabled ?? false
                        }
                      />
                    )}

                    <div className="flex flex-col gap-2">
                      <span className="text-label font-semibold uppercase text-content">Время</span>
                      {slotsPending ? (
                        <Text variant="caption" color="dim">
                          Загружаем свободные часы…
                        </Text>
                      ) : slotsError !== null ? (
                        <Text variant="caption" className="text-danger">
                          {slotsError} — попробуйте ещё раз позже.
                        </Text>
                      ) : slots.length === 0 ? (
                        <Text variant="caption" color="dim">
                          На этот день свободных часов нет — выберите другую дату.
                        </Text>
                      ) : (
                        <div
                          role="radiogroup"
                          aria-label="Время записи"
                          className="grid grid-cols-5 gap-2"
                        >
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

                    <Select
                      multiple
                      label="Услуги (необязательно)"
                      placeholder="Выберите услуги"
                      options={serviceOptions.map((option) => ({ value: option, label: option }))}
                      value={form.services}
                      onChange={set('services')}
                    />
                    <Input
                      label="Авто (необязательно)"
                      placeholder="Марка и модель"
                      value={form.car}
                      onChange={(event) => set('car')(event.target.value)}
                    />
                    <Textarea
                      label="Комментарий (необязательно)"
                      placeholder="Что беспокоит — пара слов"
                      rows={3}
                      maxLength={500}
                      value={form.comment}
                      onChange={(event) => set('comment')(event.target.value)}
                    />
                  </div>
                </TabsContent>
              </div>

              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 right-[-11px] w-[5px] rounded-full bg-border sm:hidden ${
                  hasScroll ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div
                  ref={thumbRef}
                  className="absolute inset-x-0 rounded-full bg-content-dim"
                  style={{ top: '0%', height: '100%' }}
                />
              </div>

              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-panel-2 transition-opacity motion-reduce:transition-none sm:hidden ${
                  canScrollDown ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          </Tabs>
        </div>
      </Modal>

      <Modal
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        title="Закрыть форму?"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <Text variant="body" color="muted">
            Введённые данные пропадут — продолжите заполнение или закройте без сохранения.
          </Text>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button size="lg" className="sm:flex-1" onClick={() => setConfirmClose(false)}>
              Продолжить заполнение
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="sm:flex-1"
              onClick={() => {
                setConfirmClose(false);
                close();
              }}
            >
              Закрыть
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

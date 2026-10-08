export interface BookingDateOption {
  iso: string;
  label: string;
  weekdayLabel: string;
  disabled: boolean;
}

export interface BookingSlot {
  label: string;
  disabled: boolean;
}

export interface CallbackRequest {
  name: string;
  phone: string;
  /** Honeypot: заполняют только боты. */
  company?: string;
}

export interface BookingRequest {
  name: string;
  phone: string;
  car?: string;
  services?: string[];
  comment?: string;
  date: string;
  time: string;
  idempotencyKey?: string;
  /** Honeypot: заполняют только боты. */
  company?: string;
}

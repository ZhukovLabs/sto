export interface BookingWorkHours {
  from: number;
  to: number;
}

export interface BookingDateOverride {
  hours?: BookingWorkHours;
  disabled?: boolean;
  note?: string;
}

export interface BookingSettings {
  slotStepMinutes: number;
  horizonDays: number;
  workDays: number[];
  hours: BookingWorkHours;
  overrides: Record<string, BookingDateOverride>;
}

export interface BookingDateOption {
  iso: string;
  label: string;
  weekdayLabel: string;
  disabled: boolean;
  note?: string;
}

export interface BookingSlot {
  iso: string;
  label: string;
  disabled: boolean;
}

export interface CallbackRequest {
  name: string;
  phone: string;
}

export interface BookingRequest {
  name: string;
  phone: string;
  car?: string;
  date: string;
  time: string;
}

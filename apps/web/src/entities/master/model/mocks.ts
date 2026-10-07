import type { Master } from './types';

const master: Master = {
  name: 'Максим',
  role: 'Владелец и мастер',
  experienceYears: 12,
  warrantyMonths: 6,
  photoAlt: 'Максим — владелец и мастер СТО «ПроМакс»',
};

export function getMaster(): Master {
  return master;
}

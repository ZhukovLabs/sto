export type ServiceUnit = 'wheel' | 'pcs' | 'season';

export type GroupIconKey = 'scan' | 'wrench' | 'disc' | 'cog' | 'gauge' | 'circle' | 'snowflake';

export interface ServiceGroup {
  id: string;
  title: string;
  icon: GroupIconKey | null;
  photo: string | null;
  position: number;
  isActive: boolean;
}

export interface Service {
  id: string;
  groupId: string;
  title: string;
  description: string;
  details: string | null;
  priceFrom: number;
  priceTo: number | null;
  unit: ServiceUnit | null;
  photo: string | null;
  position: number;
  isActive: boolean;
}

export interface ShowcaseSlot {
  serviceId: string;
  position: number;
}

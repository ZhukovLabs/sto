import type { CatalogGroup } from './api';
import type { Service, ServiceGroup, ServiceUnit, GroupIconKey, ShowcaseSlot } from './model/types';

export type { Service, ServiceGroup, ServiceUnit, GroupIconKey, ShowcaseSlot, CatalogGroup };
export { getServiceCatalog, fetchServiceTitles } from './api';
export {
  PriceByn,
  ServiceCard,
  groupIcon,
  servicePhoto,
  formatPriceFrom,
  UNIT_SHORT,
} from './ui/ServiceCard';

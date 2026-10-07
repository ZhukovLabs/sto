import { TEAM, TRUST_FACTS } from './model/mocks';
import type { TeamMember, TrustFact } from './model/types';

/**
 * Заглушка контракта команды. При появлении бэкенда -
 * заменить на запрос к API с revalidate.
 */
export async function getTeam(): Promise<TeamMember[]> {
  return TEAM;
}

export async function getTrustFacts(): Promise<TrustFact[]> {
  return TRUST_FACTS;
}

import { API_URL } from '@/shared/config/api';
import type { TeamMember } from './model/types';

interface TeamMemberResponse {
  name: string;
  role: string;
  spec: string;
  photo: string | null;
  photoAlt: string | null;
}

/**
 * Состав команды с @sto/api. Кэш по тегу «team» — сбрасывается из админки.
 * При недоступности API возвращает пустой список (секция скрыта).
 */
export async function getTeam(): Promise<TeamMember[]> {
  try {
    const response = await fetch(`${API_URL}/team`, {
      next: { tags: ['team'], revalidate: 3600 },
    });
    if (!response.ok) {
      return [];
    }
    const members = (await response.json()) as TeamMemberResponse[];
    return members.map((member) => ({
      name: member.name,
      role: member.role,
      spec: member.spec,
      photo: member.photo ?? undefined,
      photoAlt: member.photoAlt ?? undefined,
    }));
  } catch {
    return [];
  }
}

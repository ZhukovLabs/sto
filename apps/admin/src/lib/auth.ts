import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, apiMe } from './api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Серверный гвард страниц панели: без валидной сессии редиректит на /login.
 */
export async function requireUser(): Promise<AdminUser> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token === undefined || token === '') {
    redirect('/login');
  }
  let user: Awaited<ReturnType<typeof apiMe>>;
  try {
    user = await apiMe(token);
  } catch {
    user = null;
  }
  if (user === null) {
    redirect('/login');
  }
  return user;
}

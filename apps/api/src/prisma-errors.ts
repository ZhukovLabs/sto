/** Проверяет код ошибки Prisma (например, 'P2002' — уникальность, 'P2025' — не найдено). */
export function isPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

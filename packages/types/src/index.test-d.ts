import { describe, expectTypeOf, test } from 'vitest';
import type { HealthResponse } from './index';

describe('контракты API', () => {
  test('HealthResponse соответствует схеме /health', () => {
    expectTypeOf<HealthResponse>().toEqualTypeOf<{ status: string; uptime: number }>();
  });
});

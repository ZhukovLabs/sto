import { describe, expect, it } from 'vitest';
import { PaidChannelBudget } from './paid-budget';

describe('PaidChannelBudget', () => {
  it('считает отправки до лимита и блокирует дальше', () => {
    const budget = new PaidChannelBudget(2);
    expect(budget.tryConsume()).toBe(true);
    expect(budget.tryConsume()).toBe(true);
    expect(budget.tryConsume()).toBe(false);
    expect(budget.getSnapshot()).toEqual({
      limit: 2,
      used: 2,
      exhausted: true,
      day: expect.any(String),
    });
  });

  it('обнуляется на следующий день (по Минску)', () => {
    let current = new Date('2026-10-08T12:00:00+03:00');
    const budget = new PaidChannelBudget(1, () => current);
    expect(budget.tryConsume()).toBe(true);
    expect(budget.tryConsume()).toBe(false);

    current = new Date('2026-10-09T00:05:00+03:00');
    expect(budget.tryConsume()).toBe(true);
    expect(budget.getSnapshot().used).toBe(1);
  });

  it('нулевой лимит сразу исчерпан', () => {
    const budget = new PaidChannelBudget(0);
    expect(budget.tryConsume()).toBe(false);
    expect(budget.getSnapshot().exhausted).toBe(true);
  });
});

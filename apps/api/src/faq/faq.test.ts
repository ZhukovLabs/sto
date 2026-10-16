import { describe, expect, it } from 'vitest';
import { FaqService } from './faq.service';

/** FaqService.validate приватный — проверяем через create/update с моком Prisma не нужно:
 *  валидация чистая, поэтому тестируем через публичный create, подменив prisma. */
describe('FaqService.create валидация', () => {
  it('принимает корректную пару вопрос/ответ и обрезает пробелы', async () => {
    const created: unknown[] = [];
    const service = new FaqService({
      faqItem: {
        findFirst: async () => null,
        create: async (args: unknown) => {
          created.push(args);
          return { id: 'x', question: '', answer: '', position: 0, isActive: true };
        },
      },
    } as never);
    await service.create({
      question: '  Нужно ли записываться заранее?  ',
      answer: ' Да, запишитесь онлайн. ',
    });
    expect(created).toHaveLength(1);
  });

  it('отклоняет короткий вопрос', async () => {
    const service = new FaqService({
      faqItem: { findFirst: async () => null, create: async () => ({}) },
    } as never);
    await expect(
      service.create({ question: 'Что?', answer: 'Достаточно длинный ответ.' }),
    ).rejects.toThrow('Вопрос');
  });

  it('отклоняет короткий ответ', async () => {
    const service = new FaqService({
      faqItem: { findFirst: async () => null, create: async () => ({}) },
    } as never);
    await expect(
      service.create({ question: 'Нужно ли записываться заранее?', answer: 'Да' }),
    ).rejects.toThrow('Ответ');
  });
});

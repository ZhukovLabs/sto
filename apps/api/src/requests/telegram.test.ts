import { describe, expect, it } from 'vitest';
import {
  formatReminderMessage,
  formatRequestMessage,
  formatStartReply,
  prettyPhone,
} from './telegram';

describe('prettyPhone', () => {
  it('приводит белорусский номер к формату +375 XX XXX-XX-XX', () => {
    expect(prettyPhone('375256156607')).toBe('+375 25 615-66-07');
    expect(prettyPhone('+375 29 123-45-67')).toBe('+375 29 123-45-67');
  });

  it('оставляет неизвестный формат как есть', () => {
    expect(prettyPhone('88005553535')).toBe('88005553535');
  });
});

describe('formatRequestMessage', () => {
  it('оформляет заявку жирным заголовком и pretty-телефоном', () => {
    const message = formatRequestMessage({ name: 'Денис', phone: '375256156607' });
    expect(message).toContain('🔔 <b>Новая заявка «Перезвоните мне»</b>');
    expect(message).toContain('Имя: Денис');
    expect(message).toContain('Телефон: +375 25 615-66-07');
    expect(message).toMatch(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2} \(Минск\)/);
  });

  it('экранирует html в имени', () => {
    const message = formatRequestMessage({ name: '<b>Иван</b>', phone: '+375 29 000-00-00' });
    expect(message).toContain('&lt;b&gt;Иван&lt;/b&gt;');
  });
});

describe('formatReminderMessage', () => {
  it.each([
    [1, '1 час'],
    [2, '2 часа'],
    [3, '3 часа'],
    [4, '4 часа'],
    [5, '5 часов'],
    [11, '11 часов'],
    [21, '21 час'],
    [22, '22 часа'],
    [24, '24 часа'],
  ])('склоняет %i час(а/ов) корректно', (hours, expected) => {
    const message = formatReminderMessage(
      {
        name: 'Иван',
        phone: '+375 29 000-00-00',
        createdAt: new Date('2026-10-08T10:00:00+03:00'),
      },
      hours,
    );
    expect(message).toContain(`ждёт уже ${expected}`);
  });

  it('подставляет имя и телефон', () => {
    const message = formatReminderMessage(
      {
        name: 'Иван',
        phone: '+375 29 000-00-00',
        createdAt: new Date('2026-10-08T10:00:00+03:00'),
      },
      2,
    );
    expect(message).toContain('Имя: Иван');
    expect(message).toContain('+375 29 000-00-00');
  });
});

describe('formatStartReply', () => {
  it('показывает chat_id и инструкцию для администратора', () => {
    const reply = formatStartReply(1160368886);
    expect(reply).toContain('<code>1160368886</code>');
    expect(reply).toContain('Передайте его администратору');
  });
});

import { describe, expect, it } from 'vitest';
import {
  normalizeSiteAddress,
  normalizeSiteTelegram,
  normalizeSiteUnp,
  parseCoord,
  parsePublicPhone,
} from './site-settings.service';

describe('parsePublicPhone', () => {
  it('форматирует белорусский номер с разделителями', () => {
    expect(parsePublicPhone('+375 29 000-00-00')).toBe('+375290000000');
  });

  it('принимает голые цифры', () => {
    expect(parsePublicPhone('375290000000')).toBe('+375290000000');
  });

  it('конвертирует национальную запись 8 0XX в 375', () => {
    expect(parsePublicPhone('8 029 123-45-67')).toBe('+375291234567');
  });

  it('принимает небелорусский номер', () => {
    expect(parsePublicPhone('+7 495 123-45-67')).toBe('+74951234567');
  });

  it('отклоняет короткий ввод', () => {
    expect(parsePublicPhone('12345')).toBeNull();
    expect(parsePublicPhone('')).toBeNull();
    expect(parsePublicPhone('перезвоните')).toBeNull();
  });

  it('отклоняет слишком длинный ввод', () => {
    expect(parsePublicPhone('37529000000000000')).toBeNull();
  });
});

describe('normalizeSiteAddress', () => {
  it('обрезает пробелы', () => {
    expect(normalizeSiteAddress('  Гомель, ул. Интернациональная 5 ')).toBe(
      'Гомель, ул. Интернациональная 5',
    );
  });

  it('пустая строка и одни пробелы — сброс (null)', () => {
    expect(normalizeSiteAddress('')).toBeNull();
    expect(normalizeSiteAddress('   ')).toBeNull();
  });

  it('отклоняет слишком короткий и слишком длинный адрес', () => {
    expect(() => normalizeSiteAddress('Г')).toThrow('Адрес');
    expect(() => normalizeSiteAddress('Г'.repeat(201))).toThrow('Адрес');
  });
});

describe('normalizeSiteUnp', () => {
  it('принимает 9 цифр с разделителями', () => {
    expect(normalizeSiteUnp('390 000 000')).toBe('390000000');
  });

  it('пустая строка — сброс (null)', () => {
    expect(normalizeSiteUnp('')).toBeNull();
    expect(normalizeSiteUnp('   ')).toBeNull();
  });

  it('отклоняет не-9 цифр', () => {
    expect(() => normalizeSiteUnp('12345')).toThrow('УНП');
    expect(() => normalizeSiteUnp('1234567890')).toThrow('УНП');
    expect(() => normalizeSiteUnp('УНП скоро')).toThrow('УНП');
  });
});

describe('normalizeSiteTelegram', () => {
  it('принимает username с @ и без, приводит к @', () => {
    expect(normalizeSiteTelegram('promaks_sto')).toBe('@promaks_sto');
    expect(normalizeSiteTelegram('@promaks_sto')).toBe('@promaks_sto');
    expect(normalizeSiteTelegram('  @promaks_sto  ')).toBe('@promaks_sto');
  });

  it('пустая строка — сброс (null)', () => {
    expect(normalizeSiteTelegram('')).toBeNull();
    expect(normalizeSiteTelegram('   ')).toBeNull();
    expect(normalizeSiteTelegram('@')).toBeNull();
  });

  it('отклоняет кириллицу, спецзнаки и слишком короткие', () => {
    expect(() => normalizeSiteTelegram('ab')).toThrow('Telegram');
    expect(() => normalizeSiteTelegram('прогрев')).toThrow('Telegram');
    expect(() => normalizeSiteTelegram('has space')).toThrow('Telegram');
  });
});

describe('parseCoord', () => {
  it('число и числовая строка в границах', () => {
    expect(parseCoord(52.4345, 'Широта', { min: -90, max: 90 })).toBe(52.4345);
    expect(parseCoord('30.9754', 'Долгота', { min: -180, max: 180 })).toBe(30.9754);
  });

  it('пустая строка — сброс (null), отсутствие поля — undefined', () => {
    expect(parseCoord('', 'Широта', { min: -90, max: 90 })).toBeNull();
    expect(parseCoord(undefined, 'Широта', { min: -90, max: 90 })).toBeUndefined();
  });

  it('отклоняет мусор и выход за границы', () => {
    expect(() => parseCoord('abc', 'Широта', { min: -90, max: 90 })).toThrow('Широта');
    expect(() => parseCoord(91, 'Широта', { min: -90, max: 90 })).toThrow('Широта');
    expect(() => parseCoord(-181, 'Долгота', { min: -180, max: 180 })).toThrow('Долгота');
  });
});

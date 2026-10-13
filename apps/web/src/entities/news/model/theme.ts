import {
  AlertTriangle,
  BatteryCharging,
  Car,
  CircleDot,
  Cog,
  Disc,
  Fuel,
  Scale,
  Snowflake,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/** Темы обложек-заглушек: ключевое слово в заголовке/лиде -> иконка. */
const THEMES: readonly { icon: LucideIcon; words: RegExp }[] = [
  { icon: Cog, words: /двигател|помп|масл|мотор|антифриз|свеч|грм|ремен/i },
  { icon: BatteryCharging, words: /аккумулятор|батаре/i },
  { icon: Disc, words: /тормоз/i },
  { icon: CircleDot, words: /шин|резин|колес|подшип/i },
  {
    icon: Scale,
    words:
      /штраф|прав(?:а|ах|ам)?(?![а-яё])|гаи|гибдд|закон|осаго|каско|техосмотр|комисси|пдд|пьян|нетрезв|алкогол|нарушен|взыскан|лишен|погашен/i,
  },
  { icon: AlertTriangle, words: /дтп|авар|столкновен|сбил|наезд/i },
  { icon: Fuel, words: /топлив|бензин|дизел|газопровод|заправк/i },
  { icon: Snowflake, words: /зим|снег|гололед|мороз/i },
  { icon: Wrench, words: /сервис|ремонт|диагностик|обслуживан|чек-лист|техническ/i },
];

/** Иконка темы новости по тексту; дефолт - легковая машина. */
export function newsThemeIcon(text: string): LucideIcon {
  for (const theme of THEMES) {
    if (theme.words.test(text)) {
      return theme.icon;
    }
  }
  return Car;
}

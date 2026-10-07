export interface TeamMember {
  name: string;
  role: string;
  /** Одна строка о зоне ответственности */
  spec: string;
  /** Путь фото в public; у пока не снятых мастеров — undefined (слот) */
  photo?: string;
  photoAlt?: string;
}

export interface TrustFact {
  value: string;
  /** Мелкий суффикс рядом с цифрой: «мес.» */
  unit?: string;
  title: string;
  note: string;
}

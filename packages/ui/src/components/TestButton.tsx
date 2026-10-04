import type { ButtonHTMLAttributes } from 'react';

/**
 * Тестовый компонент: проверяет связку transpilePackages + Tailwind-токены.
 * Удалить при появлении реальной дизайн-системы.
 */
export function TestButton({
  label = 'Test',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }) {
  return (
    <button
      className="cursor-pointer rounded-lg bg-brand-800 px-4 py-2 font-medium text-white hover:bg-brand-700"
      {...props}
    >
      {label}
    </button>
  );
}

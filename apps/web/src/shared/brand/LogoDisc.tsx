interface DiscGlyphProps {
  className?: string;
}

/** Вентилируемый тормозной диск — общая геометрия фирменного знака. */
export function DiscGlyph({ className = '' }: DiscGlyphProps) {
  return (
    <g transform="translate(-1.3 1.3)" className={className}>
      <circle cx="16" cy="16" r="11.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="8.8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="7.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="16" cy="16" r="4.5" stroke="currentColor" strokeWidth="3" />
      <g fill="currentColor">
        <circle cx="23.13" cy="18.32" r="1.1" />
        <circle cx="16" cy="23.5" r="1.1" />
        <circle cx="8.87" cy="18.32" r="1.1" />
        <circle cx="11.59" cy="9.93" r="1.1" />
        <circle cx="20.41" cy="9.93" r="1.1" />
      </g>
    </g>
  );
}

interface LogoDiscProps {
  className?: string;
}

/** Тормозной диск без суппорта — для крупных фоновых водяных знаков. */
export function LogoDisc({ className = '' }: LogoDiscProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <DiscGlyph />
    </svg>
  );
}

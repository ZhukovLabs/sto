import { DiscGlyph } from './LogoDisc';

interface LogoMarkProps {
  className?: string;
}

/** Фирменный знак «ПроМакс»: тормозной диск с оранжевым суппортом и колодкой. */
export function LogoMark({ className = '' }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <DiscGlyph className="text-content-dim" />
      <g transform="translate(-1.3 1.3)">
        <path
          d="M13.74 3.2A13 13 0 0 1 28.8 18.26"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M18.98 4.89A11.5 11.5 0 0 1 27.11 13.02"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="butt"
          className="text-primary"
        />
      </g>
    </svg>
  );
}

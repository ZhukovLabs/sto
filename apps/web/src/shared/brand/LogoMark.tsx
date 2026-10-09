interface LogoMarkProps {
  className?: string;
}

/** Фирменный знак «ПроМакс»: тормозной диск с оранжевым суппортом и колодкой. */
export function LogoMark({ className = '' }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <g transform="translate(-1.3 1.3)">
        <circle
          cx="16"
          cy="16"
          r="11.2"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-content-dim"
        />
        <circle
          cx="16"
          cy="16"
          r="8.8"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-content-dim"
        />
        <circle
          cx="16"
          cy="16"
          r="7.5"
          stroke="currentColor"
          strokeWidth="1"
          className="text-content-dim"
        />
        <circle
          cx="16"
          cy="16"
          r="4.5"
          stroke="currentColor"
          strokeWidth="3"
          className="text-content-dim"
        />
        <g fill="currentColor" className="text-content-dim">
          <circle cx="23.13" cy="18.32" r="1.1" />
          <circle cx="16" cy="23.5" r="1.1" />
          <circle cx="8.87" cy="18.32" r="1.1" />
          <circle cx="11.59" cy="9.93" r="1.1" />
          <circle cx="20.41" cy="9.93" r="1.1" />
        </g>
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

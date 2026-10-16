'use client';

import { useEffect, useRef, useState, type HTMLAttributes } from 'react';

export type RevealVariant = 'up' | 'fade' | 'wipe';

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  /** Такт каскада: задержка до появления после входа в зону видимости, мс. */
  delay?: number;
  /** Хореография появления: подъём, проявление или выезд слева-направо. */
  variant?: RevealVariant;
}

const VARIANT_CLASS: Record<RevealVariant, string> = {
  up: 'reveal-up',
  fade: 'reveal-fade',
  wipe: 'reveal-wipe',
};

/**
 * Появление блока при докрутке — один раз, когда блок входит в видимую зону.
 * До монтирования JS контент не скрыт (индексация и режимы без скриптов),
 * скрытие включается только в эффекте, а IntersectionObserver его снимает.
 * Само движение — CSS-переход из tokens.css (композитор, не main thread).
 */
export function Reveal({
  delay = 0,
  variant = 'up',
  className = '',
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el === null) {
      return;
    }
    // Древний браузер без IO — не прячем: контент просто виден сразу.
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    setArmed(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      // Зона срабатывания: блок вошёл в нижнюю восьмую часть вьюпорта.
      { rootMargin: '0px 0px -12.5% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={armed && !shown ? 'hidden' : undefined}
      style={delay === 0 ? style : { transitionDelay: `${delay}ms`, ...style }}
      className={`${VARIANT_CLASS[variant]}${className === '' ? '' : ` ${className}`}`}
      {...props}
    />
  );
}

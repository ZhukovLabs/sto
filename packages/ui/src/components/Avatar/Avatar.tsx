import type { HTMLAttributes } from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';
export type AvatarStatus = 'online' | 'busy';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: AvatarStatus;
}

const sizeClass: Record<AvatarSize, string> = {
  sm: 'size-8 text-caption',
  md: 'size-11 text-body',
  lg: 'size-14 text-body-lg',
  xl: 'size-20 text-h4',
};

const statusDotSize: Record<AvatarSize, string> = {
  sm: 'size-2.5',
  md: 'size-3',
  lg: 'size-3.5',
  xl: 'size-5',
};

const statusColor: Record<AvatarStatus, string> = {
  online: 'bg-success',
  busy: 'bg-warning',
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({
  name,
  src,
  size = 'md',
  shape = 'circle',
  status,
  className = '',
  ...props
}: AvatarProps) {
  return (
    <span
      className={[
        'relative inline-flex shrink-0 items-center justify-center overflow-visible bg-panel-2 border border-border font-semibold text-content-muted select-none',
        shape === 'circle' ? 'rounded-full' : 'rounded-lg',
        sizeClass[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <span
        className={[
          'flex size-full items-center justify-center overflow-hidden',
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
        ].join(' ')}
      >
        {src ? (
          <img src={src} alt={name} className="size-full object-cover" />
        ) : (
          <span aria-hidden="true">{initials(name)}</span>
        )}
      </span>
      {status ? (
        <span
          aria-label={status === 'online' ? 'В сети' : 'Занят'}
          className={[
            'absolute -right-0.5 -bottom-0.5 rounded-full ring-2 ring-bg',
            statusDotSize[size],
            statusColor[status],
          ].join(' ')}
        />
      ) : null}
    </span>
  );
}

import type { ElementType, ReactNode } from 'react';
import { Heading, type HeadingVariant } from '../Heading/Heading';
import { Text } from '../Text/Text';

export interface SectionTitleProps {
  as?: ElementType;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  variant?: HeadingVariant;
  className?: string;
}

export function SectionTitle({
  as,
  eyebrow,
  title,
  description,
  align = 'left',
  variant = 'h2',
  className = '',
}: SectionTitleProps) {
  return (
    <div
      className={[
        'flex max-w-2xl flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {eyebrow ? (
        <Text variant="label" color="accent">
          {eyebrow}
        </Text>
      ) : null}
      <Heading as={as} variant={variant}>
        {title}
      </Heading>
      {description ? (
        <Text variant="lead" color="muted">
          {description}
        </Text>
      ) : null}
    </div>
  );
}

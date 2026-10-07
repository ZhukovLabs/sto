'use client';

import { useState, type ComponentProps } from 'react';
import { Button } from '@/shared/ui';
import { CallbackRequestDialog } from './CallbackRequestDialog';

type ButtonProps = ComponentProps<typeof Button>;

export function CallbackButton({
  size = 'sm',
  pill = false,
  className,
  children = 'Записаться',
}: Pick<ButtonProps, 'size' | 'pill' | 'className' | 'children'>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size={size}
        pill={pill}
        type="button"
        className={className}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <CallbackRequestDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

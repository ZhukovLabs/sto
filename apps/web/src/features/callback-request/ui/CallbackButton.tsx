'use client';

import { useState, type ComponentProps } from 'react';
import { Button } from '@/shared/ui';
import { CallbackRequestDialog } from './CallbackRequestDialog';

type ButtonProps = ComponentProps<typeof Button>;

interface CallbackButtonProps extends Pick<
  ButtonProps,
  'id' | 'size' | 'pill' | 'className' | 'leftIcon' | 'children'
> {
  /** Предвыбранная услуга для вкладки записи (страницы услуг). */
  preselectedService?: string;
  fullWidth?: boolean;
}

/** Кнопка, открывающая диалог записи/заявки. */
export function CallbackButton({
  id,
  size = 'sm',
  pill = false,
  className,
  leftIcon,
  fullWidth,
  children = 'Записаться',
  preselectedService,
}: CallbackButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        id={id}
        size={size}
        pill={pill}
        type="button"
        className={className}
        leftIcon={leftIcon}
        fullWidth={fullWidth}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <CallbackRequestDialog
        open={open}
        onClose={() => setOpen(false)}
        preselectedService={preselectedService}
      />
    </>
  );
}

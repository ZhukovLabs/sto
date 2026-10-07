import type { ComponentProps } from 'react';
import { Button } from '@/shared/ui';

type ButtonProps = ComponentProps<typeof Button>;

export function CallbackButton({
  size = 'sm',
  pill = false,
  className,
  children = 'Заказать звонок',
}: Pick<ButtonProps, 'size' | 'pill' | 'className' | 'children'>) {
  return (
    <Button size={size} pill={pill} type="button" className={className}>
      {children}
    </Button>
  );
}

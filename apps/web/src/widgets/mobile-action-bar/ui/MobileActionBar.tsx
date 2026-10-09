'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CalendarCheck, Phone } from 'lucide-react';
import { Button } from '@/shared/ui';
import { CallbackButton } from '@/features/callback-request';
import { site } from '@/shared/config/site';

const HERO_CTA_SELECTOR = '#hero-cta';

export function MobileActionBar() {
  const phone = site.phones[0];
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(HERO_CTA_SELECTOR);
    if (!target) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('has-action-bar', visible);
    return () => document.body.classList.remove('has-action-bar');
  }, [visible]);

  return (
    <div
      data-modal-open-hide
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-border bg-bg/95 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 ease-out sm:hidden ${
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
    >
      <div className="grid grid-cols-2 gap-3 px-4">
        <Button
          variant="outline"
          size="md"
          fullWidth
          href={`tel:${phone.value}`}
          leftIcon={<Phone aria-hidden="true" className="size-4.5" strokeWidth={2} />}
        >
          Позвонить
        </Button>
        <CallbackButton
          size="md"
          className="w-full"
          leftIcon={<CalendarCheck aria-hidden="true" className="size-4.5" strokeWidth={2} />}
        >
          Записаться
        </CallbackButton>
      </div>
    </div>
  );
}

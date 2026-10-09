'use client';

import { useState } from 'react';
import { CallbackRequestDialog } from '@/features/callback-request';
import { ServicesCatalog } from '@/features/services-catalog';
import type { CatalogGroup } from '@/entities/service';

export function ServicesCatalogSection({ catalog }: { catalog: CatalogGroup[] }) {
  const [pendingService, setPendingService] = useState<string | null>(null);

  return (
    <>
      <ServicesCatalog catalog={catalog} onOrder={(service) => setPendingService(service)} />
      <CallbackRequestDialog
        open={pendingService !== null}
        onClose={() => setPendingService(null)}
        preselectedService={pendingService || null}
      />
    </>
  );
}

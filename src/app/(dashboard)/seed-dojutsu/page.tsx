
'use client';

import { redirect } from 'next/navigation';

export default function SeedDojutsuPage() {
  // This page is deactivated.
  if (typeof window !== 'undefined') {
    redirect('/status');
  }

  return null;
}

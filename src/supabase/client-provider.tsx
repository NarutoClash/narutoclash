'use client';

import React, { ReactNode, useMemo } from 'react';
import { SupabaseProvider } from './provider';

interface SupabaseClientProviderProps {
  children: ReactNode;
}

export function SupabaseClientProvider({ children }: SupabaseClientProviderProps) {
  return (
    <SupabaseProvider>
      {children}
    </SupabaseProvider>
  );
}

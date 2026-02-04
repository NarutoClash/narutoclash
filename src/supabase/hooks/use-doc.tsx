'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '../provider';
import { errorEmitter } from '../error-emitter';
import { SupabasePermissionError } from '../errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: Error | null;
  setData: (data: any) => void;
}

/**
 * React hook to subscribe to a single Supabase row in real-time.
 * Handles nullable table/row references.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTableRow or BAD THINGS WILL HAPPEN
 * use useMemoSupabase to memoize it per React guidance. Also make sure that its dependencies are stable
 * references
 *
 * @template T Optional type for row data. Defaults to any.
 * @param {string | null | undefined} table - The table name
 * @param {string | null | undefined} rowId - The row ID
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedTableRow: ({ table: string; id: string } & { __memo?: boolean }) | null | undefined,
  _options?: { subscribe?: boolean },
): UseDocResult<T> {

  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase, user, isUserLoading } = useSupabase();

  useEffect(() => {
    let isMounted = true;
    
    // ✅ PROTEÇÃO 1: Aguardar autenticação terminar
    if (isUserLoading) {
      setIsLoading(true);
      return;
    }

    // ✅ PROTEÇÃO 2: Se não há ref, retornar early
    if (!memoizedTableRow || !memoizedTableRow.table || !memoizedTableRow.id) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // ✅ PROTEÇÃO 3: Se tabela é profiles mas não há user, não tentar carregar
    if (memoizedTableRow.table === 'profiles' && !user) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      if (!isMounted) return;

      setIsLoading(true);

      // ✅ PROTEÇÃO 4: Para profiles, verificar sessão ANTES de fazer query
      if (memoizedTableRow.table === 'profiles') {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Se não há sessão válida, não tentar
        if (!session) {
          if (isMounted) {
            setData(null);
            setIsLoading(false);
            setError(null);
          }
          return;
        }
      }

      // Initial fetch
      const { data: rowData, error: fetchError } = await supabase
        .from(memoizedTableRow.table)
        .select('*')
        .eq('id', memoizedTableRow.id)
        .single();

      if (!isMounted) return;

      if (fetchError) {
        // ✅ Detectar se é erro de autenticação
        const isAuthError = 
          fetchError.message?.includes('JWT') || 
          fetchError.message?.includes('JWE') ||
          fetchError.code === 'PGRST116' ||
          fetchError.message?.includes('Row Level Security') ||
          fetchError.message?.includes('Could not verify JWT');
        
        // Se for erro de auth e tabela profiles, silenciar (é esperado durante load)
        if (isAuthError && memoizedTableRow.table === 'profiles') {
          console.log('[useDoc] Auth not ready yet, will retry...');
          setData(null);
          setIsLoading(false);
          setError(null);
        } else {
          // Outros erros: reportar normalmente
          const contextualError = new SupabasePermissionError({
            operation: 'get',
            table: memoizedTableRow.table,
            rowId: memoizedTableRow.id,
            originalError: fetchError,
          });
          setError(contextualError);
          setData(null);
          setIsLoading(false);
          errorEmitter.emit('permission-error', contextualError);
        }
      } else {
        if (rowData) {
          setData({ ...(rowData as T), id: rowData.id });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      }
    };

    fetchData();

    // Subscribe to changes (realtime) - só se há usuário e não é loading
    let channel: any = null;
    
    if (user && !isUserLoading) {
      channel = supabase
        .channel(`doc:${memoizedTableRow.table}:${memoizedTableRow.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: memoizedTableRow.table,
            filter: `id=eq.${memoizedTableRow.id}`,
          },
          (payload) => {
            if (!isMounted) return;
            
            if (payload.eventType === 'DELETE') {
              setData(null);
            } else {
              setData({ ...(payload.new as T), id: payload.new.id });
            }
            setError(null);
            setIsLoading(false);
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [memoizedTableRow, supabase, user, isUserLoading]);

  if (memoizedTableRow && !memoizedTableRow.__memo) {
    throw new Error(
      JSON.stringify(memoizedTableRow) + ' was not properly memoized using useMemoSupabase'
    );
  }

  const manualSetData = (newData: any) => {
    if (newData === null) {
      setData(null);
    } else {
      setData({ ...newData, id: memoizedTableRow?.id || '' });
    }
  };

  return { data, isLoading, error, setData: manualSetData };
}
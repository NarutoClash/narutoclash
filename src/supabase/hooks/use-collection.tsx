'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '../provider';
import { errorEmitter } from '../error-emitter';
import { SupabasePermissionError } from '../errors';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Type for a Supabase query builder
 */
export type SupabaseQuery = {
  table: string;
  query?: (builder: any) => any;
} & { __memo?: boolean };

/**
 * React hook to subscribe to a Supabase table or query in real-time.
 * Handles nullable table/queries.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedQuery or BAD THINGS WILL HAPPEN
 * use useMemoSupabase to memoize it per React guidance. Also make sure that its dependencies are stable
 * references
 *  
 * @template T Optional type for row data. Defaults to any.
 * @param {SupabaseQuery | null | undefined} memoizedQuery - The table name and optional query builder
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
  memoizedQuery: SupabaseQuery | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { supabase } = useSupabase();

  useEffect(() => {
    setIsLoading(true);

    if (!memoizedQuery || !memoizedQuery.table) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Build the query
    let queryBuilder = supabase.from(memoizedQuery.table).select('*');
    if (memoizedQuery.query) {
      queryBuilder = memoizedQuery.query(queryBuilder);
    }

    // Initial fetch
    queryBuilder.then(({ data: rowsData, error: fetchError }) => {
      if (fetchError) {
        const contextualError = new SupabasePermissionError({
          operation: 'list',
          table: memoizedQuery.table,
          originalError: fetchError,
        });
        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      } else {
        const results: ResultItemType[] = (rowsData || []).map((row: any) => ({
          ...(row as T),
          id: row.id,
        }));
        setData(results);
        setError(null);
        setIsLoading(false);
      }
    });

    // Subscribe to changes (realtime)
    const channel = supabase
      .channel(`collection:${memoizedQuery.table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: memoizedQuery.table,
        },
        (payload) => {
          // Refetch on changes (or implement incremental updates)
          queryBuilder.then(({ data: rowsData, error: fetchError }) => {
            if (!fetchError && rowsData) {
              const results: ResultItemType[] = rowsData.map((row: any) => ({
                ...(row as T),
                id: row.id,
              }));
              setData(results);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memoizedQuery, supabase]);

  if (memoizedQuery && !memoizedQuery.__memo) {
    throw new Error(
      JSON.stringify(memoizedQuery) + ' was not properly memoized using useMemoSupabase'
    );
  }

  return { data, isLoading, error };
}

'use client';

import { errorEmitter } from './error-emitter';
import { SupabasePermissionError } from './errors';
import { useSupabase } from './provider';

/**
 * Initiates an insert operation for a table.
 * Does NOT await the write operation internally.
 */
export function insertDocumentNonBlocking(
  table: string,
  data: any,
  supabaseClient: ReturnType<typeof useSupabase>['supabase']
) {
  supabaseClient
    .from(table)
    .insert(data)
    .then(({ error }) => {
      if (error) {
        errorEmitter.emit(
          'permission-error',
          new SupabasePermissionError({
            table,
            operation: 'create',
            requestResourceData: data,
            originalError: error,
          })
        );
      }
    });
  // Execution continues immediately
}

/**
 * Initiates an update operation for a row.
 * Does NOT await the write operation internally.
 * 
 * Can be called with either:
 * - (table, rowId, data, supabaseClient) - new format
 * - (ref, data) - old Firebase-compatible format where ref is {table, id}
 */
export function updateDocumentNonBlocking(
  tableOrRef: string | { table: string; id: string } | null | undefined,
  rowIdOrData: string | any,
  dataOrSupabase?: any,
  supabaseClient?: ReturnType<typeof useSupabase>['supabase']
) {
  // Handle old Firebase-compatible format: (ref, data)
  if (tableOrRef && typeof tableOrRef === 'object' && 'table' in tableOrRef) {
    const ref = tableOrRef as { table: string; id: string };
    const data = rowIdOrData;
    const supabase = dataOrSupabase || supabaseClient;
    
    if (!ref || !ref.table || !ref.id || !supabase) return;
    
    supabase
      .from(ref.table)
      .update(data)
      .eq('id', ref.id)
      .then(({ error }) => {
        if (error) {
          errorEmitter.emit(
            'permission-error',
            new SupabasePermissionError({
              table: ref.table,
              rowId: ref.id,
              operation: 'update',
              requestResourceData: data,
              originalError: error,
            })
          );
        }
      });
    return;
  }

  // Handle new format: (table, rowId, data, supabaseClient)
  const table = tableOrRef as string;
  const rowId = rowIdOrData as string;
  const data = dataOrSupabase;
  const supabase = supabaseClient;

  if (!table || !rowId || !supabase) return;

  supabase
    .from(table)
    .update(data)
    .eq('id', rowId)
    .then(({ error }) => {
      if (error) {
        errorEmitter.emit(
          'permission-error',
          new SupabasePermissionError({
            table,
            rowId,
            operation: 'update',
            requestResourceData: data,
            originalError: error,
          })
        );
      }
    });
}

/**
 * Initiates a delete operation for a row.
 * Does NOT await the write operation internally.
 * 
 * Can be called with either:
 * - (table, rowId, supabaseClient) - new format
 * - (ref) - old Firebase-compatible format where ref is {table, id}
 */
export function deleteDocumentNonBlocking(
  tableOrRef: string | { table: string; id: string } | null | undefined,
  rowIdOrSupabase?: string | ReturnType<typeof useSupabase>['supabase'],
  supabaseClient?: ReturnType<typeof useSupabase>['supabase']
) {
  // Handle old Firebase-compatible format: (ref)
  if (tableOrRef && typeof tableOrRef === 'object' && 'table' in tableOrRef) {
    const ref = tableOrRef as { table: string; id: string };
    const supabase = rowIdOrSupabase as ReturnType<typeof useSupabase>['supabase'];
    
    if (!ref || !ref.table || !ref.id || !supabase) return;
    
    supabase
      .from(ref.table)
      .delete()
      .eq('id', ref.id)
      .then(({ error }) => {
        if (error) {
          errorEmitter.emit(
            'permission-error',
            new SupabasePermissionError({
              table: ref.table,
              rowId: ref.id,
              operation: 'delete',
              originalError: error,
            })
          );
        }
      });
    return;
  }

  // Handle new format: (table, rowId, supabaseClient)
  const table = tableOrRef as string;
  const rowId = rowIdOrSupabase as string;
  const supabase = supabaseClient;

  if (!table || !rowId || !supabase) return;

  supabase
    .from(table)
    .delete()
    .eq('id', rowId)
    .then(({ error }) => {
      if (error) {
        errorEmitter.emit(
          'permission-error',
          new SupabasePermissionError({
            table,
            rowId,
            operation: 'delete',
            originalError: error,
          })
        );
      }
    });
}

/**
 * Initiates an upsert (insert or update) operation.
 * Does NOT await the write operation internally.
 */
export function upsertDocumentNonBlocking(
  table: string,
  data: any,
  supabaseClient: ReturnType<typeof useSupabase>['supabase']
) {
  supabaseClient
    .from(table)
    .upsert(data)
    .then(({ error }) => {
      if (error) {
        errorEmitter.emit(
          'permission-error',
          new SupabasePermissionError({
            table,
            operation: 'write',
            requestResourceData: data,
            originalError: error,
          })
        );
      }
    });
}

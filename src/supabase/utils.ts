'use client';

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper function to increment a numeric field in Supabase
 * Since Supabase doesn't have increment like Firestore, we need to fetch, update, and save
 */
export async function incrementField(
  supabase: SupabaseClient,
  table: string,
  rowId: string,
  field: string,
  amount: number = 1
) {
  // First, get the current value
  const { data: current, error: fetchError } = await supabase
    .from(table)
    .select(field)
    .eq('id', rowId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const currentValue = (current as any)?.[field] || 0;
  const newValue = currentValue + amount;

  // Update with new value
  const { error: updateError } = await supabase
    .from(table)
    .update({ [field]: newValue })
    .eq('id', rowId);

  if (updateError) {
    throw updateError;
  }

  return newValue;
}

/**
 * Helper function to increment nested fields (e.g., "elementExperience.fire")
 */
export async function incrementNestedField(
  supabase: SupabaseClient,
  table: string,
  rowId: string,
  fieldPath: string,
  amount: number = 1
) {
  // Get current data
  const { data: current, error: fetchError } = await supabase
    .from(table)
    .select('*')
    .eq('id', rowId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Navigate nested path
  const pathParts = fieldPath.split('.');
  let currentObj: any = current;
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    if (!currentObj[pathParts[i]]) {
      currentObj[pathParts[i]] = {};
    }
    currentObj = currentObj[pathParts[i]];
  }

  const lastKey = pathParts[pathParts.length - 1];
  const currentValue = currentObj[lastKey] || 0;
  currentObj[lastKey] = currentValue + amount;

  // Update with modified data
  const { error: updateError } = await supabase
    .from(table)
    .update(current)
    .eq('id', rowId);

  if (updateError) {
    throw updateError;
  }

  return currentObj[lastKey];
}

/**
 * Helper to create a batch-like operation
 * Note: Supabase doesn't have true transactions in the same way, but we can group operations
 */
export class SupabaseBatch {
  private operations: Array<() => Promise<void>> = [];

  constructor(private supabase: SupabaseClient) {}

  update(table: string, rowId: string, data: any) {
    this.operations.push(async () => {
      const { error } = await this.supabase
        .from(table)
        .update(data)
        .eq('id', rowId);
      if (error) throw error;
    });
  }

  increment(table: string, rowId: string, field: string, amount: number = 1) {
    this.operations.push(async () => {
      await incrementField(this.supabase, table, rowId, field, amount);
    });
  }

  incrementNested(table: string, rowId: string, fieldPath: string, amount: number = 1) {
    this.operations.push(async () => {
      await incrementNestedField(this.supabase, table, rowId, fieldPath, amount);
    });
  }

  async commit() {
    // Execute all operations sequentially
    // Note: For true atomicity, you'd need to use Supabase RPC functions or database transactions
    for (const op of this.operations) {
      await op();
    }
  }
}

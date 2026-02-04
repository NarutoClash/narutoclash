'use client';

import { User } from '@supabase/supabase-js';

type SecurityRuleContext = {
  table: string;
  rowId?: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
  originalError?: any;
};

interface SupabaseAuthObject {
  uid: string;
  email: string | null;
  email_verified: boolean;
}

interface SecurityRuleRequest {
  auth: SupabaseAuthObject | null;
  method: string;
  table: string;
  rowId?: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds a security-rule-compliant auth object from the Supabase User.
 * @param currentUser The currently authenticated Supabase user.
 * @returns An object that mirrors request.auth in security rules, or null.
 */
function buildAuthObject(currentUser: User | null): SupabaseAuthObject | null {
  if (!currentUser) {
    return null;
  }

  return {
    uid: currentUser.id,
    email: currentUser.email || null,
    email_verified: !!currentUser.email_confirmed_at,
  };
}

/**
 * Builds the complete, simulated request object for the error message.
 * It safely tries to get the current authenticated user.
 * @param context The context of the failed Supabase operation.
 * @returns A structured request object.
 */
function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  // Note: In Supabase, we'd typically get the user from the session
  // For error reporting, we'll build a generic structure
  let authObject: SupabaseAuthObject | null = null;
  
  // In a real implementation, you'd get the current user from the Supabase session
  // For now, we'll leave it as null and let the error message indicate this

  return {
    auth: authObject,
    method: context.operation,
    table: context.table,
    rowId: context.rowId,
    resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
  };
}

/**
 * Builds the final, formatted error message for debugging.
 * @param requestObject The simulated request object.
 * @param originalError The original Supabase error.
 * @returns A string containing the error message and the JSON payload.
 */
function buildErrorMessage(requestObject: SecurityRuleRequest, originalError?: any): string {
  const errorDetails = originalError
    ? `\nOriginal Error: ${originalError.message || JSON.stringify(originalError)}`
    : '';
  
  return `Missing or insufficient permissions: The following request was denied by Supabase RLS (Row Level Security):
${JSON.stringify(requestObject, null, 2)}${errorDetails}`;
}

/**
 * A custom error class designed to be consumed for debugging.
 * It structures the error information to mimic the request object
 * available in Supabase RLS policies.
 */
export class SupabasePermissionError extends Error {
  public readonly request: SecurityRuleRequest;
  public readonly originalError?: any;

  constructor(context: SecurityRuleContext) {
    const requestObject = buildRequestObject(context);
    super(buildErrorMessage(requestObject, context.originalError));
    this.name = 'SupabasePermissionError';
    this.request = requestObject;
    this.originalError = context.originalError;
  }
}

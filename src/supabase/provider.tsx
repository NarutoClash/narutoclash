'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './client';
import { SupabaseErrorListener } from '@/components/SupabaseErrorListener';

interface SupabaseProviderProps {
  children: ReactNode;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Supabase context
export interface SupabaseContextState {
  areServicesAvailable: boolean;
  supabase: typeof supabase;
  // User authentication state
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useSupabase()
export interface SupabaseServicesAndUser {
  supabase: typeof supabase;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const SupabaseContext = createContext<SupabaseContextState | undefined>(undefined);

/**
 * SupabaseProvider manages and provides Supabase client and user authentication state.
 */
export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({
  children,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  // Effect to subscribe to Supabase auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("SupabaseProvider: getSession error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      } else {
        setUserAuthState({ 
          user: session?.user ?? null, 
          isUserLoading: false, 
          userError: null 
        });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserAuthState({ 
        user: session?.user ?? null, 
        isUserLoading: false, 
        userError: null 
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Memoize the context value
  const contextValue = useMemo((): SupabaseContextState => {
    const servicesAvailable = !!supabase;
    return {
      areServicesAvailable: servicesAvailable,
      supabase: supabase,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [userAuthState]);

  return (
    <SupabaseContext.Provider value={contextValue}>
      <SupabaseErrorListener />
      {children}
    </SupabaseContext.Provider>
  );
};

/**
 * Hook to access core Supabase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useSupabase = (): SupabaseServicesAndUser => {
  const context = useContext(SupabaseContext);

  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider.');
  }

  if (!context.areServicesAvailable || !context.supabase) {
    throw new Error('Supabase services not available. Check SupabaseProvider.');
  }

  return {
    supabase: context.supabase,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Supabase client instance. */
export const useSupabaseClient = () => {
  const { supabase } = useSupabase();
  return supabase;
};

type MemoSupabase<T> = T & { __memo?: boolean };

export function useMemoSupabase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);

  if (memoized && typeof memoized === 'object') {
    try {
      (memoized as MemoSupabase<T>).__memo = true;
    } catch (e) {
      // This can happen with frozen objects. It's okay to ignore.
    }
  }

  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useSupabase();
  return { user, isUserLoading, userError };
};

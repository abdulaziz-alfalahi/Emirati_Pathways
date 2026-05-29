/**
 * Local type definitions replacing @supabase/supabase-js imports.
 * These types match the shape used throughout the codebase.
 */
export interface User {
  id: string;
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  aud?: string;
  role?: string;
}

export interface RealtimeChannel {
  on: (event: string, callback: (payload: unknown) => void) => RealtimeChannel;
  subscribe: (callback?: (status: string) => void) => RealtimeChannel;
  unsubscribe: () => void;
}

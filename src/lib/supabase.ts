/**
 * Module: Supabase browser client
 * Purpose: Create the public client for browser-safe reads and authenticated owner sessions
 * Used by: TanStack routes and query functions
 * Dependencies: @supabase/supabase-js; VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
 * Public functions: getSupabaseClient()
 * Side effects: Reads environment variables and creates network client; no request until used
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
  client = createClient(url, publishableKey, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}

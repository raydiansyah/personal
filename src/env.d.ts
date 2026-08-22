/// <reference types="vite/client" />

/**
 * Module: Vite environment declarations
 * Purpose: Type VITE_* environment variables used by the browser client
 * Used by: src/lib/supabase.ts
 * Dependencies: Vite client type definitions
 * Public functions: ImportMetaEnv typing
 * Side effects: None; compile-time declarations only
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_R2_UPLOAD_ENDPOINT: string;
  readonly VITE_R2_PUBLIC_BASE_URL: string;
}

interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

/**
 * Module: Vite environment declarations
 * Purpose: Type VITE_* environment variables used by the browser client
 * Used by: src/lib/supabase.ts
 * Dependencies: Vite client type definitions
 * Public functions: ImportMetaEnv typing
 * Side effects: None; compile-time declarations for browser/runtime configuration only
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_R2_UPLOAD_ENDPOINT: string;
  readonly VITE_R2_PUBLIC_BASE_URL: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  turnstile?: {
    render: (container: HTMLElement, options: { sitekey: string; theme?: 'auto' | 'light' | 'dark'; callback: (token: string) => void; 'expired-callback'?: () => void; 'error-callback'?: () => void }) => string | number;
    remove?: (widgetId: string | number) => void;
  };
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Module: Turnstile runtime configuration
 * Purpose: Centralize the browser-side on/off switch for Cloudflare Turnstile
 * Used by: Login and contact forms, TurnstileWidget
 * Dependencies: Vite import.meta.env configuration
 * Public functions: isTurnstileEnabled()
 * Side effects: None; reads a build-time environment value only
 */
export function isTurnstileEnabled() {
  const value = String(import.meta.env.VITE_TURNSTILE_ENABLED ?? 'on').trim().toLowerCase();
  return !['off', 'false', '0', 'no'].includes(value);
}

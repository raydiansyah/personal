/**
 * Module: Application version metadata
 * Purpose: Expose the Git-derived major.minor version for user-facing product surfaces
 * Used by: Public footer and owner login screen
 * Dependencies: None
 * Public functions: None; exports APP_VERSION constant
 * Side effects: None
 */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0';

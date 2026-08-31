/**
 * Module: Privacy-safe analytics helper
 * Purpose: Load GA4 only when configured and record non-PII aggregate interaction events
 * Used by: Public route shell and conversion actions
 * Dependencies: Google gtag.js and Supabase browser client
 * Public functions: initAnalytics(), trackEvent(), trackPortfolioClick()
 * Side effects: Adds one analytics script, sends aggregate event names, and inserts anonymous portfolio clicks
 */
import { getSupabaseClient } from './supabase';

export function initAnalytics() { const id = import.meta.env.VITE_GA_MEASUREMENT_ID; if (!id || document.querySelector(`script[data-ga="${id}"]`)) return; const script = document.createElement('script'); script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`; script.dataset.ga = id; document.head.appendChild(script); window.dataLayer = window.dataLayer || []; window.gtag = (...args: unknown[]) => window.dataLayer?.push(args); window.gtag('js', new Date()); window.gtag('config', id, { anonymize_ip: true }); }
export function trackEvent(name: 'whatsapp_click' | 'form_submit' | 'share_click') { window.gtag?.('event', name); }
export async function trackPortfolioClick(portfolioId: string) { try { await getSupabaseClient().from('portfolio_click').insert({ portfolio_id: portfolioId }); } catch { /* Analytics must never block navigation. */ } }

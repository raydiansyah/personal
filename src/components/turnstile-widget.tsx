/**
 * Module: Cloudflare Turnstile widget
 * Purpose: Render and expose short-lived CAPTCHA tokens for protected forms
 * Used by: src/admin.tsx and src/pages/contact-page.tsx
 * Dependencies: Cloudflare Turnstile browser API; VITE_TURNSTILE_SITE_KEY; VITE_TURNSTILE_ENABLED
 * Public functions: TurnstileWidget()
 * Side effects: Loads the Turnstile script and renders a third-party widget
 */
import { useEffect, useRef } from 'react';
import { isTurnstileEnabled } from '../lib/turnstile';
import { useLanguage } from '../lib/language';
import { t } from '../lib/i18n';

let scriptPromise: Promise<void> | undefined;

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('turnstile-load-failed')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('turnstile-load-failed')), { once: true });
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function TurnstileWidget({ onToken, onError }: { onToken: (token: string) => void; onError?: (message: string) => void }) {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    if (!isTurnstileEnabled()) return;
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      onError?.(t(language, 'captcha.missing'));
      return;
    }
    let cancelled = false;
    void loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'auto',
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => onError?.(t(language, 'captcha.verifyFailed')),
      });
    }).catch((error: unknown) => onError?.(error instanceof Error && error.message !== 'turnstile-load-failed' ? error.message : t(language, 'captcha.unavailable')));
    return () => {
      cancelled = true;
      if (widgetIdRef.current !== undefined && window.turnstile?.remove) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = undefined;
    };
  }, [language, onError, onToken]);

  return <div ref={containerRef} aria-label={t(language, 'captcha.label')} />;
}

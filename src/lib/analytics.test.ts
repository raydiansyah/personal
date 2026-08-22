/**
 * Module: Analytics helper tests
 * Purpose: Verify aggregate event forwarding without loading a browser or sending real analytics
 * Used by: npm test through vitest.config.ts
 * Dependencies: Vitest, analytics helper
 * Public functions: None; test cases only
 * Side effects: Installs a temporary in-memory window mock per test
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackEvent } from './analytics';

describe('trackEvent', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('forwards only the aggregate event name to gtag', () => {
    const gtag = vi.fn();
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { gtag } });

    trackEvent('form_submit');

    expect(gtag).toHaveBeenCalledWith('event', 'form_submit');
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it('does nothing when analytics has not been loaded', () => {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });

    expect(() => trackEvent('whatsapp_click')).not.toThrow();
  });
});

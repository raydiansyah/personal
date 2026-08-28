/**
 * Module: React promotion strip
 * Purpose: Render privacy-safe share actions
 * Used by: React homepage route /
 * Dependencies: Browser Share/Clipboard APIs, analytics helper
 * Public functions: PromotionStrip()
 * Side effects: May write to the clipboard, open the native share sheet, and emit aggregate analytics events
 */
import { useState } from 'react';
import { trackEvent } from '../lib/analytics';
import { useLanguage } from '../lib/language';
import { t } from '../lib/i18n';

export function PromotionStrip() {
  const { language } = useLanguage();
  const [status, setStatus] = useState('');
  const pageUrl = typeof window === 'undefined' ? 'https://raydiansyah.com/' : window.location.href;
  async function copyLink() { await navigator.clipboard.writeText(pageUrl); setStatus(t(language, 'share.copied')); trackEvent('share_click'); }
  async function shareLink() { if (navigator.share) await navigator.share({ title: document.title, text: t(language, 'share.title'), url: pageUrl }); else await copyLink(); trackEvent('share_click'); }
  return <div className="promotion-strip"><p>{t(language, 'share.prompt')}</p><div className="share-actions"><button type="button" onClick={() => void copyLink()}>{t(language, 'share.copy')}</button><button type="button" onClick={() => void shareLink()}>{t(language, 'share.share')}</button></div>{status && <p className="share-status" role="status">{status}</p>}</div>;
}

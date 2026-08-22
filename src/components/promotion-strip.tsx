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

export function PromotionStrip() {
  const [status, setStatus] = useState('');
  const pageUrl = typeof window === 'undefined' ? 'https://raydiansyah.com/' : window.location.href;
  async function copyLink() { await navigator.clipboard.writeText(pageUrl); setStatus('Link copied.'); trackEvent('share_click'); }
  async function shareLink() { if (navigator.share) await navigator.share({ title: document.title, text: 'raydiansyah.com portfolio', url: pageUrl }); else await copyLink(); trackEvent('share_click'); }
  return <div className="promotion-strip"><p>Found this useful? Share it with someone building their next thing.</p><div className="share-actions"><button type="button" onClick={() => void copyLink()}>Copy link</button><button type="button" onClick={() => void shareLink()}>Share ↗</button></div>{status && <p className="subscribe-status" role="status">{status}</p>}</div>;
}

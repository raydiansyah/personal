/**
 * Module: React promotion strip
 * Purpose: Render privacy-safe share actions and a Supabase-backed subscription form
 * Used by: React homepage route /
 * Dependencies: Browser Share/Clipboard APIs, subscriber service, analytics helper
 * Public functions: PromotionStrip()
 * Side effects: May write a subscription email to Supabase and emit aggregate analytics events
 */
import { useState, type FormEvent } from 'react';
import { subscribeEmail } from '../lib/subscribers';
import { trackEvent } from '../lib/analytics';

export function PromotionStrip() {
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('');
  const pageUrl = typeof window === 'undefined' ? 'https://raydiansyah.com/' : window.location.href;
  async function copyLink() { await navigator.clipboard.writeText(pageUrl); setStatus('Link copied.'); trackEvent('share_click'); }
  async function shareLink() { if (navigator.share) await navigator.share({ title: document.title, text: 'raydiansyah.com portfolio', url: pageUrl }); else await copyLink(); trackEvent('share_click'); }
  async function subscribe(event: FormEvent<HTMLFormElement>) { event.preventDefault(); try { await subscribeEmail(email); setEmail(''); setStatus('Email sudah terdaftar.'); } catch { setStatus('Belum berhasil. Coba lagi nanti.'); } }
  return <><div className="promotion-strip"><p>Found this useful? Share it with someone building their next thing.</p><div className="share-actions"><button type="button" onClick={() => void copyLink()}>Copy link</button><button type="button" onClick={() => void shareLink()}>Share ↗</button></div></div><div className="subscribe-card"><div><p>Stay in the loop</p><h3>Good ideas, occasionally.</h3><small>Email hanya digunakan untuk mengirim kabar dari raydiansyah.com.</small></div><form className="subscribe-form" onSubmit={(event) => void subscribe(event)}><input type="email" aria-label="Email untuk berlangganan" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required /><label><input type="checkbox" required /> Saya setuju menerima kabar.</label><button type="submit">Subscribe ↗</button></form>{status && <p className="subscribe-status" role="status">{status}</p>}</div></>;
}

/**
 * Module: Public contact form data island
 * Purpose: Submit validated inquiries to the Supabase Edge Function
 * Used by: React homepage route / and TanStack contact route
 * Dependencies: React, Turnstile widget, contact service, Supabase Edge Function send-contact-notification
 * Public functions: ContactFormIsland()
 * Side effects: Writes pesan_kontak and triggers server-side notification; emits aggregate analytics event
 */
import { useState, type FormEvent } from 'react';
import { submitContact } from './lib/contact';
import { trackEvent } from './lib/analytics';
import { TurnstileWidget } from './components/turnstile-widget';
import { isTurnstileEnabled } from './lib/turnstile';
import { useLanguage } from './lib/language';
import { t } from './lib/i18n';

export function ContactFormIsland() {
  const { language } = useLanguage();
  const id = language === 'id';
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (String(data.get('website') ?? '').trim()) { setStatus(id ? 'Terima kasih.' : 'Thank you.'); return; }
    if (isTurnstileEnabled() && !captchaToken) { setStatus(t(language, 'contact.captcha')); return; }
    setBusy(true); setStatus('');
    try { await submitContact({ nama: String(data.get('name') ?? ''), email: String(data.get('email') ?? ''), telepon: String(data.get('phone') ?? ''), jenisLayanan: String(data.get('service') ?? ''), anggaran: String(data.get('budget') ?? ''), kebutuhan: String(data.get('message') ?? ''), captchaToken }); trackEvent('form_submit'); form.reset(); setStatus(id ? 'Pesan sudah masuk. Saya akan segera menghubungi Anda.' : 'Message received. I will get back to you soon.'); } catch { setStatus(id ? 'Pesan belum terkirim. Coba lagi atau gunakan WhatsApp.' : 'Message could not be sent. Try again or use WhatsApp.'); } finally { setBusy(false); setCaptchaToken(''); setCaptchaKey((value) => value + 1); }
  }
  return <form className="contact-form" onSubmit={onSubmit}><label>{id ? 'Nama Anda' : 'Your name'}<input name="name" type="text" placeholder={id ? 'Nama lengkap' : 'Full name'} required /></label><label>{id ? 'Email kerja' : 'Work email'}<input name="email" type="email" placeholder="you@company.com" required /></label><label>{id ? 'Nomor WhatsApp' : 'WhatsApp number'}<input name="phone" type="tel" placeholder="08xx-xxxx-xxxx" required /></label><label>{id ? 'Jenis layanan' : 'Service type'}<select name="service" defaultValue="" required><option value="" disabled>{id ? 'Pilih kebutuhan' : 'Choose a need'}</option><option value="website">Website / company profile</option><option value="aplikasi-web">{id ? 'Aplikasi web' : 'Web application'}</option><option value="company-profile">Company profile</option></select></label><label>{id ? 'Perkiraan anggaran' : 'Estimated budget'}<select name="budget" defaultValue="" required><option value="" disabled>{id ? 'Pilih range' : 'Choose a range'}</option><option>Di bawah Rp 5 juta</option><option>Rp 5–10 juta</option><option>Rp 10–25 juta</option><option>Lebih dari Rp 25 juta</option></select></label><label>{id ? 'Ceritakan tentang project' : 'Tell me about the project'}<textarea name="message" rows={3} placeholder={id ? 'Apa yang sedang Anda bangun?' : 'What are you building?'} required /></label><input className="hp-field" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /><TurnstileWidget key={captchaKey} onToken={setCaptchaToken} onError={setStatus} /><button className="form-submit" type="submit" disabled={busy}>{busy ? (id ? 'Mengirim…' : 'Sending…') : t(language, 'contact.submit')} <span>↗</span></button><p className="form-status" aria-live="polite">{status}</p></form>;
}

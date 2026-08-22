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

export function ContactFormIsland() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (String(data.get('website') ?? '').trim()) { setStatus('Terima kasih.'); return; }
    if (!captchaToken) { setStatus('Selesaikan CAPTCHA terlebih dahulu.'); return; }
    setBusy(true); setStatus('');
    try { await submitContact({ nama: String(data.get('name') ?? ''), email: String(data.get('email') ?? ''), telepon: String(data.get('phone') ?? ''), jenisLayanan: String(data.get('service') ?? ''), anggaran: String(data.get('budget') ?? ''), kebutuhan: String(data.get('message') ?? ''), captchaToken }); trackEvent('form_submit'); form.reset(); setStatus('Pesan sudah masuk. Saya akan segera menghubungi Anda.'); } catch { setStatus('Pesan belum terkirim. Coba lagi atau gunakan WhatsApp.'); } finally { setBusy(false); setCaptchaToken(''); setCaptchaKey((value) => value + 1); }
  }
  return <form className="contact-form" onSubmit={onSubmit}><label>Nama Anda<input name="name" type="text" placeholder="Nama lengkap" required /></label><label>Email kerja<input name="email" type="email" placeholder="you@company.com" required /></label><label>Nomor WhatsApp<input name="phone" type="tel" placeholder="08xx-xxxx-xxxx" required /></label><label>Jenis layanan<select name="service" defaultValue="" required><option value="" disabled>Pilih kebutuhan</option><option value="website">Website / company profile</option><option value="aplikasi-web">Aplikasi web</option><option value="company-profile">Company profile</option></select></label><label>Perkiraan anggaran<select name="budget" defaultValue="" required><option value="" disabled>Pilih range</option><option>Di bawah Rp 5 juta</option><option>Rp 5–10 juta</option><option>Rp 10–25 juta</option><option>Lebih dari Rp 25 juta</option></select></label><label>Ceritakan tentang project<textarea name="message" rows={3} placeholder="Apa yang sedang Anda bangun?" required /></label><input className="hp-field" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /><TurnstileWidget key={captchaKey} onToken={setCaptchaToken} onError={setStatus} /><button className="form-submit" type="submit" disabled={busy}>{busy ? 'Mengirim…' : 'Kirim inquiry'} <span>↗</span></button><p className="form-status" aria-live="polite">{status}</p></form>;
}

/**
 * Module: Contact notification Edge Function
 * Purpose: Validate CAPTCHA-protected public inquiries, enforce a small abuse guard, persist the row, and notify the owner with bounded retry
 * Used by: src/lib/contact.ts through Supabase Functions
 * Dependencies: Supabase PostgREST endpoint; Resend HTTP API; Cloudflare Turnstile Siteverify; TURNSTILE_ENABLED; Edge Runtime server secrets
 * Public functions: Deno.serve handler
 * Side effects: Writes pesan_kontak and sends one transactional email
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 3

type ContactPayload = {
  nama?: string
  email?: string
  telepon?: string | null
  jenis_layanan?: string | null
  perkiraan_anggaran?: string | null
  pesan?: string
  honeypot?: string
  captcha_token?: string
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
}

function clientKey(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('cf-connecting-ip') || 'unknown'
}

function isRateLimited(key: string) {
  const now = Date.now()
  const current = attempts.get(key)
  if (!current || current.resetAt <= now) { attempts.set(key, { count: 1, resetAt: now + WINDOW_MS }); return false }
  current.count += 1
  return current.count > MAX_ATTEMPTS
}

async function fetchWithRetry(input: string, init: RequestInit, maxAttempts = 2) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(input, init)
      if (response.ok || response.status < 500 || attempt === maxAttempts) return response
    } catch (error) {
      if (attempt === maxAttempts) throw error
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 250))
  }
  throw new Error('request retry exhausted')
}

function isTurnstileEnabled() {
  const value = (Deno.env.get('TURNSTILE_ENABLED') ?? 'on').trim().toLowerCase()
  return !['off', 'false', '0', 'no'].includes(value)
}

async function verifyCaptcha(token: string | undefined, remoteIp: string) {
  if (!isTurnstileEnabled()) return true
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret || !token) return false
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: remoteIp }),
  })
  if (!response.ok) return false
  const result = await response.json() as { success?: boolean }
  return result.success === true
}

async function persistContact(payload: Required<Pick<ContactPayload, 'nama' | 'email' | 'pesan'>> & ContactPayload) {
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY')
  if (!secretKey) throw new Error('SUPABASE_SECRET_KEY is not configured')
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/pesan_kontak`, {
    method: 'POST',
    headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ nama: payload.nama, email: payload.email, telepon: payload.telepon || null, jenis_layanan: payload.jenis_layanan || null, perkiraan_anggaran: payload.perkiraan_anggaran || 'Belum ditentukan', pesan: payload.pesan }),
  })
  if (!response.ok) throw new Error(`contact persistence failed: ${response.status}`)
}

async function notifyOwner(payload: Required<Pick<ContactPayload, 'nama' | 'email' | 'pesan'>> & ContactPayload) {
  const response = await fetchWithRetry('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY') ?? ''}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('NOTIFICATION_EMAIL_FROM'),
      to: [Deno.env.get('NOTIFICATION_EMAIL_TO')],
      subject: `Inquiry baru dari ${payload.nama}`,
      html: `<h2>Inquiry baru</h2><p><strong>Nama:</strong> ${escapeHtml(payload.nama)}</p><p><strong>Email:</strong> ${escapeHtml(payload.email)}</p><p><strong>Telepon:</strong> ${escapeHtml(payload.telepon || '-')}</p><p><strong>Layanan:</strong> ${escapeHtml(payload.jenis_layanan || '-')}</p><p><strong>Anggaran:</strong> ${escapeHtml(payload.perkiraan_anggaran || '-')}</p><p><strong>Pesan:</strong><br>${escapeHtml(payload.pesan).replace(/\n/g, '<br>')}</p>`,
    }),
  })
  if (!response.ok) throw new Error(`email notification failed: ${response.status}`)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  if (isRateLimited(clientKey(request))) return json({ error: 'rate_limited' }, 429)
  let payload: ContactPayload
  try { payload = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }
  if (payload.honeypot?.trim()) return json({ ok: true }, 200)
  if (!(await verifyCaptcha(payload.captcha_token, clientKey(request)))) return json({ error: 'captcha_failed' }, 400)
  if (!payload.nama?.trim() || !payload.email?.trim() || !payload.pesan?.trim()) return json({ error: 'missing_required_fields' }, 400)
  if (payload.nama.length > 160 || payload.email.length > 320 || payload.pesan.length > 5000) return json({ error: 'field_too_long' }, 400)
  const normalized = { ...payload, nama: payload.nama.trim(), email: payload.email.trim(), pesan: payload.pesan.trim() }
  try { await persistContact(normalized as Required<Pick<ContactPayload, 'nama' | 'email' | 'pesan'>> & ContactPayload); await notifyOwner(normalized as Required<Pick<ContactPayload, 'nama' | 'email' | 'pesan'>> & ContactPayload); return json({ ok: true }, 201) } catch { console.error('contact submission failed'); return json({ error: 'contact_submission_failed' }, 502) }
})

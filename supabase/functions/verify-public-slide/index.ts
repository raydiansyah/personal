/**
 * Module: Public slide access verifier
 * Purpose: Verify optional material access codes and return only authorized slide metadata
 * Used by: src/lib/slides.ts through Supabase Functions
 * Dependencies: Supabase REST API; SUPABASE_URL; PRIVATE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY
 * Public functions: Deno.serve handler
 * Side effects: Performs bounded read-only Supabase REST queries
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type SlideRecord = { id: string; judul: string; slug: string; storage_path: string; mime_type: 'text/html' | 'application/pdf'; material_id: string | null; urutan: number; status_tampil: boolean }
type MaterialRecord = { id: string; akses_kode: string | null; akses_berakhir_pada: string | null; status_tampil: boolean }

function json(body: Record<string, unknown>, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
function restHeaders(secret: string) { return { apikey: secret, Authorization: `Bearer ${secret}` } }
function isExpired(value: string | null) { return Boolean(value && new Date(value).getTime() <= Date.now()) }

async function rest<T>(path: string): Promise<T[]> {
  const base = Deno.env.get('SUPABASE_URL')
  const secret = Deno.env.get('PRIVATE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!base || !secret) throw new Error('Supabase server environment is not configured')
  const response = await fetch(`${base}/rest/v1/${path}`, { headers: restHeaders(secret) })
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`)
  return await response.json() as T[]
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  let payload: { slug?: string; access_code?: string }
  try { payload = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }
  const slug = payload.slug?.trim()
  if (!slug || slug.length > 160) return json({ error: 'invalid_slug' }, 400)
  try {
    const slideRows = await rest<SlideRecord>(`slide_presentasi?select=id,judul,slug,storage_path,mime_type,material_id,urutan,status_tampil&slug=eq.${encodeURIComponent(slug)}&status_tampil=eq.true&limit=1`)
    const slide = slideRows[0]
    if (!slide) return json({ error: 'not_found' }, 404)
    if (!slide.material_id) return json({ slide, slides: [{ id: slide.id, judul: slide.judul, slug: slide.slug, urutan: slide.urutan }] })
    const materials = await rest<MaterialRecord>(`material?select=id,akses_kode,akses_berakhir_pada,status_tampil&id=eq.${encodeURIComponent(slide.material_id)}&status_tampil=eq.true&limit=1`)
    const material = materials[0]
    if (!material) return json({ error: 'not_found' }, 404)
    if (isExpired(material.akses_berakhir_pada)) return json({ error: 'access_expired' }, 410)
    if (material.akses_kode && payload.access_code !== material.akses_kode) return json({ error: payload.access_code ? 'invalid_access_code' : 'access_required' }, payload.access_code ? 403 : 401)
    const slides = await rest<Pick<SlideRecord, 'id' | 'judul' | 'slug' | 'urutan'>>(`slide_presentasi?select=id,judul,slug,urutan&material_id=eq.${encodeURIComponent(slide.material_id)}&status_tampil=eq.true&order=urutan.asc,dibuat_pada.asc`)
    return json({ slide, slides })
  } catch { return json({ error: 'slide_access_failed' }, 502) }
})

/**
 * Module: Owner admin data service
 * Purpose: Provide authenticated Supabase operations for content management and inbox review
 * Used by: src/admin.tsx
 * Dependencies: Supabase browser client for metadata/Auth; Cloudflare R2 presign endpoint for file bytes
 * Public functions: signInOwner(), signOutOwner(), getOwnerSession(), listOwnerPortfolio(), createPortfolio(), deletePortfolio(), listTestimonials(), createTestimonial(), listSlides(), slugify(), uploadSlide(), listContactMessages()
 * Side effects: Auth session persistence, authenticated database reads/writes, and HTTP uploads with progress callbacks
 */
import { getSupabaseClient } from './supabase';
import type { Portfolio } from './portfolio';

export async function signInOwner(email: string, password: string) { return getSupabaseClient().auth.signInWithPassword({ email, password }); }
export async function signOutOwner() { return getSupabaseClient().auth.signOut(); }
export async function getOwnerSession() { return getSupabaseClient().auth.getSession(); }
export async function listOwnerPortfolio(): Promise<Portfolio[]> { const { data, error } = await getSupabaseClient().from('portofolio').select('id, judul, slug, kategori, ringkasan, url_gambar').order('tanggal', { ascending: false }); if (error) throw error; return data as Portfolio[]; }
export async function createPortfolio(input: Pick<Portfolio, 'judul' | 'slug' | 'kategori' | 'ringkasan'>) { const { data: { user } } = await getSupabaseClient().auth.getUser(); if (!user) throw new Error('Owner session required'); const { error } = await getSupabaseClient().from('portofolio').insert({ ...input, created_by: user.id }); if (error) throw error; }
export async function deletePortfolio(id: string) { const { error } = await getSupabaseClient().from('portofolio').update({ status_tampil: false }).eq('id', id); if (error) throw error; }
export type Testimonial = { id: string; nama: string; jabatan: string | null; kutipan: string; status_tampil: boolean };
export async function listTestimonials(): Promise<Testimonial[]> { const { data, error } = await getSupabaseClient().from('testimoni').select('id, nama, jabatan, kutipan, status_tampil').order('tanggal', { ascending: false }); if (error) throw error; return data ?? []; }
export async function createTestimonial(input: Pick<Testimonial, 'nama' | 'jabatan' | 'kutipan'>) { const { data: { user } } = await getSupabaseClient().auth.getUser(); if (!user) throw new Error('Owner session required'); const { error } = await getSupabaseClient().from('testimoni').insert({ ...input, created_by: user.id }); if (error) throw error; }
export type Slide = { id: string; judul: string; slug: string; mime_type: string; storage_path: string };
export async function listSlides(): Promise<Slide[]> { const { data, error } = await getSupabaseClient().from('slide_presentasi').select('id, judul, slug, mime_type, storage_path').order('dibuat_pada', { ascending: false }); if (error) throw error; return data ?? []; }
export type UploadProgress = { phase: 'preparing' | 'uploading' | 'saving'; percent: number };
const MAX_SLIDE_SIZE = 10 * 1024 * 1024;

export function slugify(value: string) { return value.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); }

function uploadToR2(url: string, file: File, onProgress?: (progress: UploadProgress) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.timeout = 120_000;
    request.setRequestHeader('Content-Type', file.type);
    request.upload.addEventListener('progress', (event) => { if (event.lengthComputable) onProgress?.({ phase: 'uploading', percent: Math.round((event.loaded / event.total) * 100) }); });
    request.addEventListener('load', () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`Upload file gagal (HTTP ${request.status}).`)));
    request.addEventListener('error', () => reject(new Error('Upload file gagal karena koneksi terputus.')));
    request.addEventListener('abort', () => reject(new Error('Upload file dibatalkan.')));
    request.addEventListener('timeout', () => reject(new Error('Upload file timeout setelah 2 menit.')));
    request.send(file);
  });
}

export async function uploadSlide(file: File, judul: string, slug: string, onProgress?: (progress: UploadProgress) => void) {
  if (!['text/html', 'application/pdf'].includes(file.type)) throw new Error('File harus HTML atau PDF.');
  if (file.size > MAX_SLIDE_SIZE) throw new Error('Ukuran file maksimal 10MB.');
  const normalizedSlug = slugify(slug || judul);
  if (!normalizedSlug) throw new Error('Judul slide harus menghasilkan slug yang valid.');
  onProgress?.({ phase: 'preparing', percent: 0 });
  const supabase = getSupabaseClient(); const { data: { user } } = await supabase.auth.getUser(); const { data: { session } } = await supabase.auth.getSession();
  if (!user || !session?.access_token) throw new Error('Owner session required.');
  const endpoint = import.meta.env.VITE_R2_UPLOAD_ENDPOINT; if (!endpoint) throw new Error('Missing VITE_R2_UPLOAD_ENDPOINT.');
  const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), 30_000);
  let presign: Response;
  try { presign = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ filename: file.name, contentType: file.type, slug: normalizedSlug }), signal: controller.signal }); } catch (error) { if (error instanceof DOMException && error.name === 'AbortError') throw new Error('Server upload tidak merespons dalam 30 detik.'); throw new Error('Gagal menghubungi server upload.'); } finally { window.clearTimeout(timeout); }
  if (!presign.ok) throw new Error(`Gagal menyiapkan upload (HTTP ${presign.status}).`);
  const { url, key } = await presign.json() as { url: string; key: string };
  await uploadToR2(url, file, onProgress);
  onProgress?.({ phase: 'saving', percent: 100 });
  const inserted = await supabase.from('slide_presentasi').insert({ judul: judul.trim(), slug: normalizedSlug, storage_path: key, mime_type: file.type, created_by: user.id });
  if (inserted.error) throw new Error(`File sudah terupload, tetapi metadata gagal disimpan: ${inserted.error.message}`);
}
export async function listContactMessages() { const { data, error } = await getSupabaseClient().from('pesan_kontak').select('id, nama, email, status, dibuat_pada').order('dibuat_pada', { ascending: false }); if (error) throw error; return data ?? []; }

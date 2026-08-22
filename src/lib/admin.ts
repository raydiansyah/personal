/**
 * Module: Owner admin data service
 * Purpose: Provide authenticated Supabase operations for content management and inbox review
 * Used by: src/admin.tsx
 * Dependencies: Supabase browser client for metadata/Auth; Cloudflare R2 presign endpoint for file bytes
 * Public functions: signInOwner(), signOutOwner(), getOwnerSession(), listOwnerPortfolio(), createPortfolio(), deletePortfolio(), listTestimonials(), createTestimonial(), listSlides(), uploadSlide(), listContactMessages()
 * Side effects: Auth session persistence and authenticated database reads/writes
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
export async function uploadSlide(file: File, judul: string, slug: string) { if (!['text/html', 'application/pdf'].includes(file.type)) throw new Error('File harus HTML atau PDF'); if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran file maksimal 10MB'); const supabase = getSupabaseClient(); const { data: { user } } = await supabase.auth.getUser(); const { data: { session } } = await supabase.auth.getSession(); if (!user || !session?.access_token) throw new Error('Owner session required'); const endpoint = import.meta.env.VITE_R2_UPLOAD_ENDPOINT; if (!endpoint) throw new Error('Missing VITE_R2_UPLOAD_ENDPOINT'); const presign = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ filename: file.name, contentType: file.type, slug }) }); if (!presign.ok) throw new Error('Gagal mendapatkan presigned URL R2'); const { url, key } = await presign.json() as { url: string; key: string }; const uploaded = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file }); if (!uploaded.ok) throw new Error('Gagal upload file ke Cloudflare R2'); const inserted = await supabase.from('slide_presentasi').insert({ judul, slug, storage_path: key, mime_type: file.type, created_by: user.id }); if (inserted.error) throw inserted.error; }
export async function listContactMessages() { const { data, error } = await getSupabaseClient().from('pesan_kontak').select('id, nama, email, status, dibuat_pada').order('dibuat_pada', { ascending: false }); if (error) throw error; return data ?? []; }

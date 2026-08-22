/**
 * Module: Public presentation slide service
 * Purpose: Read visible HTML/PDF presentation metadata by custom slug
 * Used by: Public slide route /s/$slug
 * Dependencies: Supabase browser client; slide_presentasi public-read policy
 * Public functions: getSlideBySlug()
 * Side effects: Performs one public Supabase read; no writes
 */
import { getSupabaseClient } from './supabase';

export type PublicSlide = { id: string; judul: string; slug: string; storage_path: string; mime_type: 'text/html' | 'application/pdf' };
export async function getSlideBySlug(slug: string): Promise<PublicSlide | null> { const { data, error } = await getSupabaseClient().from('slide_presentasi').select('id, judul, slug, storage_path, mime_type').eq('slug', slug).eq('status_tampil', true).maybeSingle(); if (error) throw error; return data as PublicSlide | null; }

/**
 * Module: Public profile content service
 * Purpose: Read editable profile, public skills, CV, toolkit, and experience content from Supabase
 * Used by: Homepage and About page
 * Dependencies: Supabase browser client; profil_situs, keahlian, and pengalaman RLS policies
 * Public functions: getSiteProfile(), listSkills(), listExperience()
 * Side effects: Performs public Supabase reads; no writes
 */
import { getSupabaseClient } from './supabase';

export type SiteProfile = { id: number; label: string; judul: string; ringkasan: string; url_cv: string | null; url_github: string | null; url_linkedin: string | null; url_instagram: string | null; toolkit: string[] };
export type Experience = { id: string; periode: string; judul: string; ringkasan: string; stack: string; urutan: number };
export type Skill = { id: string; nama: string; kategori: string; urutan: number };

export async function getSiteProfile(): Promise<SiteProfile | null> {
  const { data, error } = await getSupabaseClient().from('profil_situs').select('id, label, judul, ringkasan, url_cv, url_github, url_linkedin, url_instagram, toolkit').eq('status_tampil', true).maybeSingle();
  if (error) throw error;
  return data as SiteProfile | null;
}

export async function listExperience(): Promise<Experience[]> {
  const { data, error } = await getSupabaseClient().from('pengalaman').select('id, periode, judul, ringkasan, stack, urutan').eq('status_tampil', true).order('urutan', { ascending: true }).order('dibuat_pada', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listSkills(): Promise<Skill[]> {
  const { data, error } = await getSupabaseClient().from('keahlian').select('id, nama, kategori, urutan').eq('status_tampil', true).order('urutan', { ascending: true }).order('dibuat_pada', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

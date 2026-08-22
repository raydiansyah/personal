/**
 * Module: Portfolio query service
 * Purpose: Read published portfolio records through Supabase with category/search filters
 * Used by: TanStack portfolio route and homepage query
 * Dependencies: Supabase browser client; public portofolio table RLS policy
 * Public functions: listPortfolio(), listPortfolioCategories(), getPortfolioBySlug()
 * Side effects: Performs one Supabase read per query invocation; no writes
 */
import { getSupabaseClient } from './supabase';

export type PortfolioCategory = 'aplikasi-web' | 'website' | 'company-profile';
export type Portfolio = { id: string; judul: string; slug: string; kategori: PortfolioCategory; ringkasan: string; url_gambar: string | null; teknologi?: string[]; tujuan?: string | null; tantangan?: string | null; solusi?: string | null; url_demo?: string | null; durasi?: string | null; galeri?: string[] };
export type PortfolioCategoryOption = { label: string; value?: PortfolioCategory };

function categoryLabel(value: PortfolioCategory) { return value === 'aplikasi-web' ? 'Web app' : value === 'company-profile' ? 'Company profile' : 'Website'; }

export async function listPortfolioCategories(): Promise<PortfolioCategoryOption[]> {
  const { data, error } = await getSupabaseClient().from('portofolio').select('kategori').eq('status_tampil', true);
  if (error) throw error;
  const values = [...new Set((data ?? []).map((item) => item.kategori as PortfolioCategory))];
  return [{ label: 'All' }, ...values.map((value) => ({ label: categoryLabel(value), value }))];
}

export async function listPortfolio(filters: { category?: PortfolioCategory; search?: string } = {}): Promise<Portfolio[]> {
  let query = getSupabaseClient().from('portofolio').select('id, judul, slug, kategori, ringkasan, url_gambar, teknologi, tujuan, tantangan, solusi, url_demo, durasi, galeri').eq('status_tampil', true).order('tanggal', { ascending: false });
  if (filters.category) query = query.eq('kategori', filters.category);
  if (filters.search) query = query.or(`judul.ilike.%${filters.search}%,ringkasan.ilike.%${filters.search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data as Portfolio[];
}

export async function getPortfolioBySlug(slug: string): Promise<Portfolio | null> {
  const { data, error } = await getSupabaseClient().from('portofolio').select('id, judul, slug, kategori, ringkasan, url_gambar, teknologi, tujuan, tantangan, solusi, url_demo, durasi, galeri').eq('slug', slug).eq('status_tampil', true).maybeSingle();
  if (error) throw error;
  return data as Portfolio | null;
}

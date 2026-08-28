/**
 * Module: Public presentation slide service
 * Purpose: Read authorized HTML/PDF presentation metadata and ordered learning paths by custom slug
 * Used by: Public slide route /s/$slug
 * Dependencies: Supabase browser client; slide_presentasi public-read policy
 * Public functions: getSlideBySlug()
 * Side effects: Performs a server-verified Edge Function read; no writes
 */
export type PublicSlide = { id: string; judul: string; slug: string; storage_path: string; mime_type: 'text/html' | 'application/pdf'; material_id: string | null; urutan: number };
export type PublicMaterial = { id: string; judul: string; slug: string; deskripsi: string };
export type PublicSlideLink = Pick<PublicSlide, 'id' | 'judul' | 'slug' | 'urutan'>;
export class SlideAccessError extends Error { constructor(public readonly code: 'access_required' | 'invalid_access_code' | 'access_expired' | 'slide_access_failed') { super(code); this.name = 'SlideAccessError'; } }
export async function getSlideBySlug(slug: string, accessCode = ''): Promise<{ slide: PublicSlide; material?: PublicMaterial; slides: PublicSlideLink[] } | null> { const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-public-slide`, { method: 'POST', headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '', 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, access_code: accessCode || undefined }) }); let payload: { error?: string; slide?: PublicSlide; material?: PublicMaterial; slides?: PublicSlideLink[] }; try { payload = await response.json() as typeof payload; } catch { throw new SlideAccessError('slide_access_failed'); } if (response.status === 404) return null; if (!response.ok || !payload.slide || !payload.slides) throw new SlideAccessError((payload.error as SlideAccessError['code']) || 'slide_access_failed'); return { slide: payload.slide, material: payload.material, slides: payload.slides }; }

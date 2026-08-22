/**
 * Module: Public presentation page
 * Purpose: Render approved HTML/PDF slides through a custom public slug
 * Used by: TanStack route /s/$slug
 * Dependencies: TanStack Query/Router, Cloudflare R2 public URL, slide service
 * Public functions: SlidePage()
 * Side effects: Public Supabase read and sandboxed iframe navigation; shows configuration error when R2 public URL is absent
 */
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getSlideBySlug } from '../lib/slides';

export function SlidePage() { const { slug } = useParams({ strict: false }) as { slug?: string }; const result = useQuery({ queryKey: ['slide', slug], queryFn: () => getSlideBySlug(slug ?? '') }); const slide = result.data; if (!slide) return <section className="page section"><p className="eyebrow">Presentation</p><h1>Slide tidak ditemukan.</h1><Link className="button" to="/">Kembali ke home</Link></section>; const baseUrl = import.meta.env.VITE_R2_PUBLIC_BASE_URL; if (!baseUrl) return <section className="page section"><p className="eyebrow">Presentation</p><h1>Slide belum dikonfigurasi.</h1><p className="lede">VITE_R2_PUBLIC_BASE_URL belum tersedia pada deployment ini.</p><Link className="button" to="/">Kembali ke home</Link></section>; const url = `${baseUrl.replace(/\/$/, '')}/${slide.storage_path}`; return <section className="page section"><p className="eyebrow">Presentation · {slide.mime_type}</p><h1>{slide.judul}</h1><div style={{ minHeight: '70vh', border: '1px solid #ffffff20', borderRadius: 24, overflow: 'hidden' }}><iframe title={slide.judul} src={url} sandbox={slide.mime_type === 'text/html' ? 'allow-scripts' : undefined} style={{ width: '100%', height: '70vh', border: 0 }} /></div></section>; }

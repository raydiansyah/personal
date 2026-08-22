/**
 * Module: Dynamic About page
 * Purpose: Present editable profile, experience, toolkit, CV, and social links
 * Used by: TanStack route /about
 * Dependencies: React Query, profile content service, shared Feature component
 * Public functions: AboutPage()
 * Side effects: Performs public Supabase reads for profile and experience content
 */
import { useQuery } from '@tanstack/react-query';
import { Feature } from '../components/site-shell';
import { getSiteProfile, listExperience } from '../lib/profile';

export function AboutPage() {
  const profile = useQuery({ queryKey: ['site-profile'], queryFn: getSiteProfile, staleTime: 60_000 });
  const experience = useQuery({ queryKey: ['experience'], queryFn: listExperience, staleTime: 60_000 });
  if (profile.isLoading || experience.isLoading) return <section className="page section"><p className="muted">Memuat profil…</p></section>;
  if (profile.isError || experience.isError) return <section className="page section"><p className="muted">Profil belum dapat dimuat. Periksa koneksi Supabase.</p></section>;
  if (!profile.data) return <section className="page section"><p className="muted">Profil belum tersedia.</p></section>;
  const item = profile.data;
  return <section className="page section"><div className="hero" style={{ minHeight: 'auto', paddingTop: 0, gridTemplateColumns: '1fr' }}><div><p className="eyebrow">{item.label}</p><h1>{item.judul}</h1><p className="lede">{item.ringkasan}</p><div className="actions">{item.url_cv && <a className="button primary" href={item.url_cv} download>Unduh CV ↗</a>}{item.url_github && <a className="button" href={item.url_github} rel="noreferrer">GitHub ↗</a>}{item.url_linkedin && <a className="button" href={item.url_linkedin} rel="noreferrer">LinkedIn ↗</a>}{item.url_instagram && <a className="button" href={item.url_instagram} rel="noreferrer">Instagram ↗</a>}</div></div></div><div className="section-heading"><div><p className="eyebrow">Experience</p><h2>A practice built in chapters.</h2></div></div><div className="grid">{(experience.data ?? []).map((entry) => <Feature key={entry.id} number={entry.periode} title={entry.judul} text={entry.ringkasan} />)}</div><div className="section-heading"><div><p className="eyebrow">Toolkit</p><h2>Tools I think with.</h2></div></div><p className="tag" style={{ fontSize: '1rem', lineHeight: 2 }}>{item.toolkit.join(' · ')}</p></section>;
}

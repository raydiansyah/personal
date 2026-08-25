/**
 * Module: Dynamic About page
 * Purpose: Present editable profile, experience, managed skills, CV, and social links
 * Used by: TanStack route /about
 * Dependencies: React Query, profile content service, managed skills service, shared Feature component
 * Public functions: AboutPage()
 * Side effects: Performs public Supabase reads for profile, experience, and visible skills
 */
import { useQuery } from '@tanstack/react-query';
import { Feature } from '../components/site-shell';
import { getSiteProfile, listExperience, listSkills } from '../lib/profile';
import { useLanguage } from '../lib/language';

export function AboutPage() {
  const { language } = useLanguage();
  const id = language === 'id';
  const profile = useQuery({ queryKey: ['site-profile'], queryFn: getSiteProfile, staleTime: 60_000 });
  const experience = useQuery({ queryKey: ['experience'], queryFn: listExperience, staleTime: 60_000 });
  const skills = useQuery({ queryKey: ['skills'], queryFn: listSkills, staleTime: 60_000 });
  if (profile.isLoading || experience.isLoading || skills.isLoading) return <section className="page section"><p className="muted">{id ? 'Memuat profil…' : 'Loading profile…'}</p></section>;
  if (profile.isError || experience.isError || skills.isError) return <section className="page section"><p className="muted">{id ? 'Profil belum dapat dimuat. Periksa koneksi Supabase.' : 'Profile could not be loaded. Check the Supabase connection.'}</p></section>;
  if (!profile.data) return <section className="page section"><p className="muted">{id ? 'Profil belum tersedia.' : 'Profile is not available yet.'}</p></section>;
  const item = profile.data;
  const visibleSkills = skills.data ?? [];
  const skillItems = visibleSkills.length ? visibleSkills : item.toolkit.map((nama, index) => ({ id: String(index), nama, kategori: 'Toolkit', urutan: index }));
  return <section className="page section"><div className="hero" style={{ minHeight: 'auto', paddingTop: 0, gridTemplateColumns: '1fr' }}><div><p className="eyebrow">{item.label}</p><h1>{item.judul}</h1><p className="lede">{item.ringkasan}</p><div className="actions">{item.url_cv && <a className="button primary" href={item.url_cv} download>{id ? 'Unduh CV ↗' : 'Download CV ↗'}</a>}{item.url_github && <a className="button" href={item.url_github} rel="noreferrer">GitHub ↗</a>}{item.url_linkedin && <a className="button" href={item.url_linkedin} rel="noreferrer">LinkedIn ↗</a>}{item.url_instagram && <a className="button" href={item.url_instagram} rel="noreferrer">Instagram ↗</a>}</div></div></div><div className="section-heading"><div><p className="eyebrow">{id ? 'Pengalaman' : 'Experience'}</p><h2>{id ? 'Praktik yang dibangun bertahap.' : 'A practice built in chapters.'}</h2></div></div><div className="grid">{(experience.data ?? []).map((entry) => <Feature key={entry.id} number={entry.periode} title={entry.judul} text={entry.ringkasan} />)}</div><div className="section-heading"><div><p className="eyebrow">Skills</p><h2>{id ? 'Tools yang saya gunakan.' : 'Tools I build with.'}</h2></div></div><div className="skill-cloud">{skillItems.map((skill) => <span className="skill-chip" key={skill.id}>{skill.nama}</span>)}</div></section>;
}

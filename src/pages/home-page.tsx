/**
 * Module: React homepage
 * Purpose: Render the complete portfolio landing experience from React components
 * Used by: TanStack route /
 * Dependencies: Framer Motion hero, TanStack Query portfolio, Supabase contact form
 * Public functions: HomePage()
 * Side effects: Reads published portfolio data and submits contact inquiries through an Edge Function
 */
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ContactFormIsland } from '../contact-entry';
import { PromotionStrip } from '../components/promotion-strip';
import { InteractiveHero } from '../hero-entry';
import { PortfolioDataIsland } from '../portfolio-entry';
import { listExperience } from '../lib/profile';

export function HomePage() {
  const experience = useQuery({ queryKey: ['experience'], queryFn: listExperience, staleTime: 60_000 });
  return <>
    <section className="hero section-wrap" aria-label="Perkenalan raydiansyah.com"><InteractiveHero /></section>
    <section className="section-wrap section" id="work"><div className="section-heading"><div><p className="eyebrow">01 / Selected work</p><h2>Work that moves<br /><em>business forward.</em></h2></div><p className="section-note">Portfolio dibaca langsung dari backend—filter dan pencarian tanpa reload.</p></div><PortfolioDataIsland /></section>
    <section className="section-wrap compact-about" id="about"><p className="eyebrow">02 / About</p><div><h2>Clarity first.<br /><em>Craft always.</em></h2><p>Saya membantu bisnis menerjemahkan ide yang kompleks menjadi pengalaman digital yang terasa sederhana, relevan, dan siap berkembang.</p><Link className="text-link" to="/about">Lihat profil <span>↗</span></Link></div></section>
    <section className="section-wrap experience-section" id="experience"><div className="section-heading"><div><p className="eyebrow">03 / Experience</p><h2>Built across<br /><em>the stack.</em></h2></div><p className="section-note">Pengalaman yang menghubungkan product thinking, interface design, dan engineering.</p></div>{experience.isLoading && <p className="section-note">Memuat experience…</p>}{experience.isError && <p className="section-note">Experience belum dapat dimuat.</p>}<div className="experience-list">{(experience.data ?? []).map((item) => <article key={item.id}><span className="experience-year">{item.periode}</span><div><h3>{item.judul}</h3><p>{item.ringkasan}</p></div><span className="experience-stack">{item.stack}</span></article>)}</div></section>
    <section className="section-wrap"><PromotionStrip /></section>
    <section className="contact-section" id="contact"><div className="section-wrap contact-inner"><div><p className="eyebrow">04 / Start a project</p><h2>Build something<br /><em>worth finding.</em></h2><p className="contact-copy">Form ini tersimpan ke Supabase dan mengirim notifikasi melalui Edge Function.</p><a className="button button-light" href="https://wa.me/6287852600073?text=Halo%20raydiansyah.com%2C%20saya%20ingin%20konsultasi%20project." target="_blank" rel="noreferrer">Chat via WhatsApp <span>↗</span></a></div><ContactFormIsland /></div></section>
  </>;
}

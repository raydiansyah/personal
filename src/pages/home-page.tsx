/**
 * Module: React homepage
 * Purpose: Render the complete portfolio landing experience from React components
 * Used by: TanStack route /
 * Dependencies: Framer Motion hero, TanStack Query portfolio, Supabase contact form
 * Public functions: HomePage()
 * Side effects: Reads published portfolio data and submits contact inquiries through an Edge Function
 */
import { Link } from '@tanstack/react-router';
import { ContactFormIsland } from '../contact-entry';
import { PromotionStrip } from '../components/promotion-strip';
import { InteractiveHero } from '../hero-entry';
import { PortfolioDataIsland } from '../portfolio-entry';

const experience = [
  ['NOW', 'Independent digital studio', 'Membangun website, aplikasi web, dan sistem digital untuk bisnis yang sedang bertumbuh.', 'React · TypeScript · Supabase'],
  ['2021—24', 'Product & web development', 'Menerjemahkan kebutuhan bisnis menjadi produk yang jelas, mudah dipakai, dan siap dikembangkan.', 'TanStack · Node.js · Laravel'],
  ['EARLIER', 'Designing useful systems', 'Membangun fondasi visual, alur kerja, dan pengalaman digital dengan perhatian pada detail.', 'UX · UI · Python'],
] as const;

export function HomePage() {
  return <>
    <section className="hero section-wrap" aria-label="Perkenalan raydiansyah.com"><InteractiveHero /></section>
    <section className="section-wrap section" id="work"><div className="section-heading"><div><p className="eyebrow">01 / Selected work</p><h2>Work that moves<br /><em>business forward.</em></h2></div><p className="section-note">Portfolio dibaca langsung dari backend—filter dan pencarian tanpa reload.</p></div><PortfolioDataIsland /></section>
    <section className="section-wrap compact-about" id="about"><p className="eyebrow">02 / About</p><div><h2>Clarity first.<br /><em>Craft always.</em></h2><p>Saya membantu bisnis menerjemahkan ide yang kompleks menjadi pengalaman digital yang terasa sederhana, relevan, dan siap berkembang.</p><Link className="text-link" to="/about">Lihat profil <span>↗</span></Link></div></section>
    <section className="section-wrap experience-section" id="experience"><div className="section-heading"><div><p className="eyebrow">03 / Experience</p><h2>Built across<br /><em>the stack.</em></h2></div><p className="section-note">Pengalaman yang menghubungkan product thinking, interface design, dan engineering.</p></div><div className="experience-list">{experience.map(([year, title, text, stack]) => <article key={year}><span className="experience-year">{year}</span><div><h3>{title}</h3><p>{text}</p></div><span className="experience-stack">{stack}</span></article>)}</div></section>
    <section className="section-wrap"><PromotionStrip /></section>
    <section className="contact-section" id="contact"><div className="section-wrap contact-inner"><div><p className="eyebrow">04 / Start a project</p><h2>Build something<br /><em>worth finding.</em></h2><p className="contact-copy">Form ini tersimpan ke Supabase dan mengirim notifikasi melalui Edge Function.</p><a className="button button-light" href="https://wa.me/6287852600073?text=Halo%20raydiansyah.com%2C%20saya%20ingin%20konsultasi%20project." target="_blank" rel="noreferrer">Chat via WhatsApp <span>↗</span></a></div><ContactFormIsland /></div></section>
  </>;
}

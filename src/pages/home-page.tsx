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
import { useLanguage } from '../lib/language';

export function HomePage() {
  const { language } = useLanguage();
  const id = language === 'id';
  const experience = useQuery({ queryKey: ['experience'], queryFn: listExperience, staleTime: 60_000 });
  return <>
    <section className="hero section-wrap" aria-label={id ? 'Perkenalan raydiansyah.com' : 'Introduction to raydiansyah.com'}><InteractiveHero /></section>
    <section className="section-wrap section" id="work"><div className="section-heading"><div><p className="eyebrow">01 / {id ? 'Karya terpilih' : 'Selected work'}</p><h2>{id ? <>Karya yang menggerakkan<br /><em>bisnis ke depan.</em></> : <>Work that moves<br /><em>business forward.</em></>}</h2></div><p className="section-note">{id ? 'Portfolio dibaca langsung dari backend—filter dan pencarian tanpa reload.' : 'Portfolio is read directly from the backend—filter and search without a reload.'}</p></div><PortfolioDataIsland /></section>
    <section className="section-wrap compact-about" id="about"><p className="eyebrow">02 / {id ? 'Tentang' : 'About'}</p><div><h2>Clarity first.<br /><em>Craft always.</em></h2><p>{id ? 'Saya membantu bisnis menerjemahkan ide kompleks menjadi pengalaman digital yang sederhana, relevan, dan siap berkembang.' : 'I help businesses turn complex ideas into digital experiences that feel simple, relevant, and ready to grow.'}</p><Link className="text-link" to="/about">{id ? 'Lihat profil' : 'View profile'} <span>↗</span></Link></div></section>
    <section className="section-wrap experience-section" id="experience"><div className="section-heading"><div><p className="eyebrow">03 / {id ? 'Pengalaman' : 'Experience'}</p><h2>{id ? <>Dibangun lintas<br /><em>stack.</em></> : <>Built across<br /><em>the stack.</em></>}</h2></div><p className="section-note">{id ? 'Pengalaman yang menghubungkan product thinking, interface design, dan engineering.' : 'Experience connecting product thinking, interface design, and engineering.'}</p></div>{experience.isLoading && <p className="section-note">{id ? 'Memuat pengalaman…' : 'Loading experience…'}</p>}{experience.isError && <p className="section-note">{id ? 'Pengalaman belum dapat dimuat.' : 'Experience could not be loaded.'}</p>}<div className="experience-list">{(experience.data ?? []).map((item) => <article key={item.id}><span className="experience-year">{item.periode}</span><div><h3>{item.judul}</h3><p>{item.ringkasan}</p></div><span className="experience-stack">{item.stack}</span></article>)}</div></section>
    <section className="section-wrap"><PromotionStrip /></section>
    <section className="contact-section" id="contact"><div className="section-wrap contact-inner"><div><p className="eyebrow">04 / {id ? 'Mulai project' : 'Start a project'}</p><h2>{id ? <>Bangun sesuatu yang<br /><em>layak ditemukan.</em></> : <>Build something<br /><em>worth finding.</em></>}</h2><a className="button button-light" href={`https://wa.me/6287852600073?text=${encodeURIComponent(id ? 'Halo raydiansyah.com, saya ingin konsultasi project.' : 'Hi raydiansyah.com, I would like to discuss a project.')}`} target="_blank" rel="noreferrer">{id ? 'Chat via WhatsApp' : 'Chat on WhatsApp'} <span>↗</span></a></div><ContactFormIsland /></div></section>
  </>;
}

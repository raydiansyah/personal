/**
 * Module: About page
 * Purpose: Present profile, practice, skills, CV download, and social links
 * Used by: TanStack route /about
 * Dependencies: Shared Feature component and local CV asset
 * Public functions: AboutPage()
 * Side effects: Browser download and external social navigation
 */
import { Feature } from '../components/site-shell';

export function AboutPage() { return <section className="page section"><div className="hero" style={{ minHeight: 'auto', paddingTop: 0 }}><div><p className="eyebrow">About Suprayogo</p><h1>Good work starts with paying attention.</h1><p className="lede">Saya membangun pengalaman digital di persimpangan strategi, desain, dan teknologi — dengan perhatian pada konteks bisnis, bahasa yang jelas, dan detail yang terasa manusiawi.</p><div className="actions"><a className="button primary" href="/cv-raydiansyah.txt" download>Unduh CV ↗</a><a className="button" href="https://github.com/raydiansyah" rel="noreferrer">GitHub ↗</a><a className="button" href="https://www.linkedin.com/in/raydiansyah/" rel="noreferrer">LinkedIn ↗</a><a className="button" href="https://www.instagram.com/raydiansyah/" rel="noreferrer">Instagram ↗</a></div></div><div className="orb" aria-label="Foto profil ilustratif" role="img" /></div><div className="section-heading"><div><p className="eyebrow">Experience</p><h2>A practice built in chapters.</h2></div></div><div className="grid"><Feature number="Now" title="Independent studio" text="Membantu bisnis dan tim kecil membuat digital presence serta web application yang lebih terarah." /><Feature number="Next" title="Long-term thinking" text="Setiap launch diperlakukan sebagai awal dari sistem yang bisa terus dirawat." /><Feature number="Always" title="Keep learning" text="Eksperimen dengan tools baru, tanpa kehilangan dasar: problem yang jelas dan craft yang rapi." /></div><div className="section-heading"><div><p className="eyebrow">Toolkit</p><h2>Tools I think with.</h2></div></div><p className="tag" style={{ fontSize: '1rem', lineHeight: 2 }}>JavaScript · TypeScript · React · Node.js · Supabase · Laravel · TanStack · Python · HTML · CSS</p></section>; }

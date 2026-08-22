/**
 * Module: Public site shared components
 * Purpose: Centralize React navigation shell, theme control, footer, and reusable content cards
 * Used by: Public TanStack pages
 * Dependencies: React, TanStack Router
 * Public functions: SiteShell(), Feature(), ProjectCard()
 * Side effects: Client-side navigation only
 */
import { Link, Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { initAnalytics } from '../lib/analytics';

export function SiteShell() { const [dark, setDark] = useState(() => document.documentElement.dataset.theme !== 'light'); useEffect(() => { initAnalytics(); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; window.localStorage.setItem('raydiansyah-theme', dark ? 'dark' : 'light'); }, [dark]); return <div className="app-shell"><a className="skip-link" href="#main-content">Lewati ke konten utama</a><header className="site-header"><Link className="brand" to="/" aria-label="raydiansyah.com home"><span className="brand-mark">R</span><span>raydiansyah<span className="brand-dot">.</span>com</span></Link><nav className="desktop-nav" aria-label="Navigasi utama"><a href="/#work">Work</a><a href="/#experience">Experience</a><Link to="/about">About</Link><a href="/#contact">Contact</a></nav><button className="theme-toggle" type="button" aria-pressed={dark} aria-label={dark ? 'Aktifkan light mode' : 'Aktifkan dark mode'} onClick={() => setDark((value) => !value)}><span aria-hidden="true">{dark ? '☼' : '◐'}</span><span>{dark ? 'Dark' : 'Light'}</span></button><Link className="header-cta" to="/contact">Mulai ngobrol <span>↗</span></Link></header><main id="main-content"><Outlet /></main><footer className="site-footer section-wrap"><Link className="brand" to="/"><span className="brand-mark">R</span><span>raydiansyah<span className="brand-dot">.</span>com</span></Link><p>© {new Date().getFullYear()} raydiansyah.com.</p><div><a href="https://github.com/raydiansyah" target="_blank" rel="noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/in/raydiansyah/" target="_blank" rel="noreferrer">LinkedIn ↗</a></div></footer></div>; }
export function Feature({ number, title, text }: { number: string; title: string; text: string }) { return <article className="card"><span className="tag">{number}</span><h3>{title}</h3><p className="muted">{text}</p></article>; }
export function ProjectCard({ title, type, text, slug }: { title: string; type: string; text: string; slug: string }) { return <article className="card"><span className="tag">{type}</span><h3>{title}</h3><p className="muted">{text}</p><Link className="tag" to="/portfolio/$slug" params={{ slug }}>View case ↗</Link></article>; }

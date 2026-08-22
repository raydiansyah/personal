/**
 * Module: Public React site shell
 * Purpose: Provide fixed navigation, responsive menu, theme control, back-to-top action, footer, and shared cards
 * Used by: TanStack public, auth, and admin routes
 * Dependencies: React, TanStack Router, analytics helper, landing design tokens
 * Public functions: SiteShell(), Feature(), ProjectCard()
 * Side effects: Persists theme preference, listens to scroll state, and performs client-side navigation
 */
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { initAnalytics } from '../lib/analytics';

export function SiteShell() {
  const location = useLocation();
  const [dark, setDark] = useState(() => { const saved = window.localStorage.getItem('raydiansyah-theme'); return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    initAnalytics();
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    window.localStorage.setItem('raydiansyah-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 420);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function backToTop() {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
    <header className="site-header">
      <Link className="brand" to="/" aria-label="raydiansyah.com home"><span className="brand-mark">R</span><span>raydiansyah<span className="brand-dot">.</span>com</span></Link>
      <nav className={`desktop-nav${mobileOpen ? ' mobile-open' : ''}`} aria-label="Navigasi utama">
        <a href="/#work">Work</a><a href="/#experience">Experience</a><Link to="/about">About</Link><a href="/#contact">Contact</a>
      </nav>
      <button className="theme-toggle" type="button" aria-pressed={dark} aria-label={dark ? 'Aktifkan light mode' : 'Aktifkan dark mode'} onClick={() => setDark((value) => !value)}><span aria-hidden="true">{dark ? '☼' : '◐'}</span><span>{dark ? 'Dark' : 'Light'}</span></button>
      <Link className="header-cta" to="/contact">Mulai ngobrol <span>↗</span></Link>
      <button className="menu-toggle" type="button" aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}>☰</button>
    </header>
    <main id="main-content"><Outlet /></main>
    <footer className="site-footer section-wrap"><Link className="brand" to="/"><span className="brand-mark">R</span><span>raydiansyah<span className="brand-dot">.</span>com</span></Link><p>© {new Date().getFullYear()} raydiansyah.com.</p><div><a href="https://github.com/raydiansyah" target="_blank" rel="noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/in/raydiansyah/" target="_blank" rel="noreferrer">LinkedIn ↗</a></div></footer>
    <button className={`back-to-top${showBackToTop ? ' is-visible' : ''}`} type="button" aria-label="Kembali ke atas" onClick={backToTop} tabIndex={showBackToTop ? 0 : -1}>↑ <span>Top</span></button>
  </div>;
}

export function Feature({ number, title, text }: { number: string; title: string; text: string }) { return <article className="card"><span className="tag">{number}</span><h3>{title}</h3><p className="muted">{text}</p></article>; }
export function ProjectCard({ title, type, text, slug }: { title: string; type: string; text: string; slug: string }) { return <article className="card"><span className="tag">{type}</span><h3>{title}</h3><p className="muted">{text}</p><Link className="tag" to="/portfolio/$slug" params={{ slug }}>View case ↗</Link></article>; }

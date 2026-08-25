/**
 * Module: Public React site shell
 * Purpose: Provide fixed navigation, responsive menu, theme control, back-to-top action, footer, and shared cards
 * Used by: TanStack public, auth, and admin routes
 * Dependencies: React, TanStack Router, language preference, analytics helper, brand submark asset, landing design tokens
 * Public functions: SiteShell(), Feature(), ProjectCard(), BrandLogo()
 * Side effects: Persists theme and analytics consent preferences, synchronizes theme changes from dashboard, conditionally loads analytics, listens to scroll state, and performs client-side navigation
 */
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { initAnalytics } from '../lib/analytics';
import { APP_VERSION } from '../lib/version';
import { useLanguage } from '../lib/language';

export function SiteShell() {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const [dark, setDark] = useState(() => { const saved = window.localStorage.getItem('raydiansyah-theme'); return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState<'granted' | 'denied' | null>(() => { const value = window.localStorage.getItem('raydiansyah-analytics-consent'); return value === 'granted' || value === 'denied' ? value : null; });

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    window.localStorage.setItem('raydiansyah-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const syncTheme = (event: Event) => { const value = (event as CustomEvent<'dark' | 'light'>).detail; if (value === 'dark' || value === 'light') setDark(value === 'dark'); };
    window.addEventListener('raydiansyah-theme-change', syncTheme);
    return () => window.removeEventListener('raydiansyah-theme-change', syncTheme);
  }, []);

  useEffect(() => {
    if (analyticsConsent === 'granted') initAnalytics();
    if (analyticsConsent) window.localStorage.setItem('raydiansyah-analytics-consent', analyticsConsent);
  }, [analyticsConsent]);

  useEffect(() => {
    setMobileOpen(false);
    setLanguageMenuOpen(false);
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

  function selectLanguage(nextLanguage: 'en' | 'id') {
    setLanguage(nextLanguage);
    setLanguageMenuOpen(false);
  }

  if (location.pathname.startsWith('/dashboard')) return <main id="main-content" className="dashboard-route"><Outlet /></main>;

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
    <header className="site-header">
      <Link className="brand" to="/" aria-label="raydiansyah.com home"><BrandLogo /><span className="brand-wordmark"><span className="brand-wordmark-name">raydiansyah</span><span className="brand-wordmark-domain">.com</span></span></Link>
      <nav className={`desktop-nav${mobileOpen ? ' mobile-open' : ''}`} aria-label={language === 'id' ? 'Navigasi utama' : 'Main navigation'}>
        <a href="/#work">{language === 'id' ? 'Karya' : 'Work'}</a><a href="/#experience">{language === 'id' ? 'Pengalaman' : 'Experience'}</a><Link to="/about">{language === 'id' ? 'Tentang' : 'About'}</Link><a href="/#contact">{language === 'id' ? 'Kontak' : 'Contact'}</a>
      </nav>
      <div className="language-switch" aria-label="Language"><div className="language-desktop-options"><button type="button" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={() => selectLanguage('en')}>EN</button><span aria-hidden="true">|</span><button type="button" className={language === 'id' ? 'active' : ''} aria-pressed={language === 'id'} onClick={() => selectLanguage('id')}>ID</button></div><div className="language-mobile-options"><button type="button" className="language-mobile-trigger" aria-expanded={languageMenuOpen} aria-haspopup="menu" onClick={() => setLanguageMenuOpen((value) => !value)}>{language.toUpperCase()} <span aria-hidden="true">⌄</span></button>{languageMenuOpen && <div className="language-mobile-menu" role="menu"><button type="button" role="menuitem" className={language === 'en' ? 'active' : ''} onClick={() => selectLanguage('en')}>EN</button><button type="button" role="menuitem" className={language === 'id' ? 'active' : ''} onClick={() => selectLanguage('id')}>ID</button></div>}</div></div>
      <button className="theme-toggle" type="button" aria-pressed={dark} aria-label={dark ? (language === 'id' ? 'Aktifkan light mode' : 'Enable light mode') : (language === 'id' ? 'Aktifkan dark mode' : 'Enable dark mode')} onClick={() => setDark((value) => !value)}><span aria-hidden="true">{dark ? '☼' : '◐'}</span><span>{dark ? 'Dark' : 'Light'}</span></button>
      <Link className="header-cta" to="/contact">{language === 'id' ? 'Mulai ngobrol' : 'Start a conversation'} <span>↗</span></Link>
      <button className="menu-toggle" type="button" aria-label={mobileOpen ? (language === 'id' ? 'Tutup menu' : 'Close menu') : (language === 'id' ? 'Buka menu' : 'Open menu')} aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}>☰</button>
    </header>
    <main id="main-content"><Outlet /></main>
    <footer className="site-footer section-wrap"><Link className="brand" to="/"><BrandLogo /><span className="brand-wordmark"><span className="brand-wordmark-name">raydiansyah</span><span className="brand-wordmark-domain">.com</span></span></Link><p>© {new Date().getFullYear()} raydiansyah.com.</p><div><a href="https://github.com/raydiansyah" target="_blank" rel="noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/in/raydiansyah/" target="_blank" rel="noreferrer">LinkedIn ↗</a></div><small className="site-version">v{APP_VERSION}</small></footer>
    {analyticsConsent === null && <aside className="consent-banner" aria-label={language === 'id' ? 'Persetujuan analytics' : 'Analytics consent'}><p>{language === 'id' ? 'Situs ini menggunakan analytics anonim untuk memahami performa halaman dan interaksi umum.' : 'This site uses anonymous analytics to understand page performance and general interactions.'}</p><div><button type="button" onClick={() => setAnalyticsConsent('denied')}>{language === 'id' ? 'Tolak' : 'Decline'}</button><button type="button" onClick={() => setAnalyticsConsent('granted')}>{language === 'id' ? 'Setuju' : 'Accept'}</button></div></aside>}
    <button className={`back-to-top${showBackToTop ? ' is-visible' : ''}`} type="button" aria-label={language === 'id' ? 'Kembali ke atas' : 'Back to top'} onClick={backToTop} tabIndex={showBackToTop ? 0 : -1}>↑ <span>Top</span></button>
  </div>;
}

export function BrandLogo() { return <span className="brand-logo-frame"><img className="brand-logo" src="/brand-submark.png" alt="" aria-hidden="true" /></span>; }

export function Feature({ number, title, text }: { number: string; title: string; text: string }) { return <article className="card"><span className="tag">{number}</span><h3>{title}</h3><p className="muted">{text}</p></article>; }
export function ProjectCard({ title, type, text, slug }: { title: string; type: string; text: string; slug: string }) { return <article className="card"><span className="tag">{type}</span><h3>{title}</h3><p className="muted">{text}</p><Link className="tag" to="/portfolio/$slug" params={{ slug }}>View case ↗</Link></article>; }

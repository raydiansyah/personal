/**
 * Module: Public site shared components
 * Purpose: Centralize navigation shell and reusable content cards
 * Used by: Public TanStack pages
 * Dependencies: React, TanStack Router
 * Public functions: SiteShell(), Feature(), ProjectCard()
 * Side effects: Client-side navigation only
 */
import { Link, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { initAnalytics } from '../lib/analytics';

export function SiteShell() { useEffect(() => { initAnalytics(); }, []); return <div className="app-shell"><header className="site-header"><Link className="brand" to="/">raydiansyah<span>.com</span></Link><nav className="nav" aria-label="Navigasi utama"><Link to="/portfolio">Work</Link><Link to="/services">Services</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link></nav></header><main><Outlet /></main></div>; }
export function Feature({ number, title, text }: { number: string; title: string; text: string }) { return <article className="card"><span className="tag">{number}</span><h3>{title}</h3><p className="muted">{text}</p></article>; }
export function ProjectCard({ title, type, text, slug }: { title: string; type: string; text: string; slug: string }) { return <article className="card"><span className="tag">{type}</span><h3>{title}</h3><p className="muted">{text}</p><Link className="tag" to="/portfolio/$slug" params={{ slug }}>View case ↗</Link></article>; }

/**
 * Module: Owner dashboard pages
 * Purpose: Provide a focused, route-based content management dashboard for the owner
 * Used by: TanStack dashboard routes under /dashboard
 * Dependencies: React, TanStack Router, Supabase owner data service, preview components
 * Public functions: DashboardApp()
 * Side effects: Reads authenticated owner data and navigates to the login route when unauthenticated
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { PortfolioPreview } from '../components/portfolio-preview';
import { SlidePreview } from '../components/slide-preview';
import { getOwnerSession, listContactMessages, listOwnerPortfolio, listSlides, listTestimonials, signOutOwner, type Slide, type Testimonial } from '../lib/admin';
import type { Portfolio } from '../lib/portfolio';
import { APP_VERSION } from '../lib/version';

type Message = { id: string; nama: string; email: string; status: string; dibuat_pada?: string };
type DashboardData = { portfolio: Portfolio[]; slides: Slide[]; testimonials: Testimonial[]; messages: Message[] };

const navGroups = [
  { label: 'Workspace', items: [{ label: 'Overview', path: '/dashboard', icon: 'grid' }, { label: 'Portfolio', path: '/dashboard/portfolio', icon: 'briefcase' }, { label: 'Slides', path: '/dashboard/slide', icon: 'layers' }] },
  { label: 'Content', items: [{ label: 'Testimonials', path: '/dashboard/testimonials', icon: 'quote' }, { label: 'Messages', path: '/dashboard/messages', icon: 'inbox' }] },
];

function DashboardIcon({ name }: { name: string }) {
  const paths: Record<string, string> = { grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z', briefcase: 'M4 7h16v13H4zM8 7V4h8v3M4 12h16', layers: 'm12 4 8 4-8 4-8-4 8-4Zm-8 8 8 4 8-4M4 16l8 4 8-4', quote: 'M7 11H4a3 3 0 0 1 3-3h1v5a5 5 0 0 1-5 5M17 11h-3a3 3 0 0 1 3-3h1v5a5 5 0 0 1-5 5', inbox: 'M4 5h16v14H4zM4 14h4l2 3h4l2-3h4', search: 'm20 20-4.2-4.2M10.8 17a6.2 6.2 0 1 1 0-12.4 6.2 6.2 0 0 1 0 12.4Z', arrow: 'M5 12h13m-5-5 5 5-5 5', logout: 'M10 5H5v14h5m5-4 4-3-4-3m4 3H9' };
  return <svg className="dashboard-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.grid} /></svg>;
}

function DashboardNav({ pathname, onLogout }: { pathname: string; onLogout: () => void }) {
  return <aside className="dashboard-sidebar"><Link className="dashboard-brand" to="/dashboard"><span className="dashboard-brand-mark"><img src="/brand-submark.svg" alt="" aria-hidden="true" /></span><span>raydiansyah<span className="dashboard-brand-dot">.</span>com</span></Link><div className="dashboard-nav">{navGroups.map((group) => <div className="dashboard-nav-group" key={group.label}><p>{group.label}</p>{group.items.map((item) => <Link key={item.path} className={`dashboard-nav-link${pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path)) ? ' is-active' : ''}`} to={item.path}><DashboardIcon name={item.icon} /><span>{item.label}</span></Link>)}</div>)}</div><div className="dashboard-sidebar-footer"><Link className="dashboard-nav-link" to="/"><DashboardIcon name="arrow" /><span>View site</span></Link><button className="dashboard-logout" type="button" onClick={onLogout}><DashboardIcon name="logout" /><span>Log out</span></button><small>v{APP_VERSION}</small></div></aside>;
}

function MetricCard({ label, value, note, icon }: { label: string; value: number; note: string; icon: string }) {
  return <article className="dashboard-metric"><div className="dashboard-metric-top"><span>{label}</span><span className="dashboard-icon-wrap"><DashboardIcon name={icon} /></span></div><strong>{value}</strong><small>{note}</small></article>;
}

function Overview({ data }: { data: DashboardData }) {
  const recentMessages = data.messages.slice(0, 5);
  return <><div className="dashboard-page-heading"><div><p className="dashboard-kicker">Owner workspace</p><h1>Good morning, Ray.</h1><p>Kelola karya, presentasi, dan pesan masuk dari satu tempat.</p></div><Link className="dashboard-primary-action" to="/admin">Open content studio <DashboardIcon name="arrow" /></Link></div><div className="dashboard-metrics"><MetricCard label="Published work" value={data.portfolio.length} note="Portfolio entries" icon="briefcase" /><MetricCard label="Presentation" value={data.slides.length} note="Published slides" icon="layers" /><MetricCard label="Testimonials" value={data.testimonials.length} note="Client voices" icon="quote" /><MetricCard label="Inbox" value={data.messages.length} note="Contact messages" icon="inbox" /></div><div className="dashboard-overview-grid"><section className="dashboard-panel dashboard-activity-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Latest activity</p><h2>Recent messages</h2></div><Link to="/dashboard/messages">View all <DashboardIcon name="arrow" /></Link></div>{recentMessages.length ? <div className="dashboard-message-list">{recentMessages.map((message) => <div className="dashboard-message-row" key={message.id}><span className="dashboard-avatar">{message.nama.slice(0, 1).toUpperCase()}</span><div><strong>{message.nama}</strong><small>{message.email}</small></div><span className={`dashboard-status status-${message.status}`}>{message.status}</span></div>)}</div> : <div className="dashboard-empty"><strong>No messages yet.</strong><span>Pesan baru dari form kontak akan muncul di sini.</span></div>}</section><section className="dashboard-panel dashboard-quick-panel"><p className="dashboard-kicker">Quick actions</p><h2>Keep the studio moving.</h2><div className="dashboard-quick-list"><Link to="/dashboard/portfolio"><DashboardIcon name="briefcase" /><span><strong>Review portfolio</strong><small>Update your published work</small></span><DashboardIcon name="arrow" /></Link><Link to="/dashboard/slide"><DashboardIcon name="layers" /><span><strong>Manage slides</strong><small>Open your presentation library</small></span><DashboardIcon name="arrow" /></Link><Link to="/dashboard/messages"><DashboardIcon name="inbox" /><span><strong>Read inbox</strong><small>Follow up with new inquiries</small></span><DashboardIcon name="arrow" /></Link></div></section></div></>;
}

function PortfolioView({ data }: { data: Portfolio[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const filtered = useMemo(() => data.filter((item) => (!category || item.kategori === category) && (!query || `${item.judul} ${item.slug}`.toLowerCase().includes(query.toLowerCase()))), [category, data, query]);
  return <DashboardCollection title="Portfolio" kicker="Published work" description="Kelola karya yang tampil di landing page." actionLabel="Open content studio" actionPath="/admin"><div className="dashboard-toolbar"><label className="dashboard-search"><DashboardIcon name="search" /><span className="sr-only">Search portfolio</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search portfolio" /></label><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter portfolio category"><option value="">All categories</option><option value="website">Website</option><option value="aplikasi-web">Aplikasi web</option><option value="company-profile">Company profile</option></select></div><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Preview</th><th>Project</th><th>Category</th><th>Status</th><th>Link</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><PortfolioPreview title={item.judul} demoUrl={item.url_demo} coverUrl={item.url_gambar} compact /></td><td><strong>{item.judul}</strong><small>{item.slug}</small></td><td>{item.kategori}</td><td><span className="dashboard-status status-live">Published</span></td><td>{item.url_demo ? <a className="dashboard-table-link" href={item.url_demo} target="_blank" rel="noreferrer">Open <DashboardIcon name="arrow" /></a> : '—'}</td></tr>)}</tbody></table>{filtered.length === 0 && <DashboardEmpty title="No portfolio found" text="Coba ubah kata kunci atau filter kategori." />}</div></DashboardCollection>;
}

function SlideView({ data }: { data: Slide[] }) {
  const [query, setQuery] = useState('');
  const [mime, setMime] = useState('');
  const filtered = useMemo(() => data.filter((item) => (!mime || item.mime_type === mime) && (!query || `${item.judul} ${item.slug}`.toLowerCase().includes(query.toLowerCase()))), [data, mime, query]);
  return <DashboardCollection title="Slides" kicker="Presentation library" description="Kelola deck HTML dan PDF yang dapat dibagikan." actionLabel="Open content studio" actionPath="/admin"><div className="dashboard-toolbar"><label className="dashboard-search"><DashboardIcon name="search" /><span className="sr-only">Search slides</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search slides" /></label><select value={mime} onChange={(event) => setMime(event.target.value)} aria-label="Filter slide type"><option value="">All types</option><option value="text/html">HTML</option><option value="application/pdf">PDF</option></select></div><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Preview</th><th>Title</th><th>Type</th><th>Slug</th><th>Action</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><SlidePreview title={item.judul} storagePath={item.storage_path} mimeType={item.mime_type} /></td><td><strong>{item.judul}</strong></td><td>{item.mime_type === 'text/html' ? 'HTML' : 'PDF'}</td><td>{item.slug}</td><td><a className="dashboard-table-link" href={`/s/${item.slug}`} target="_blank" rel="noreferrer">Open <DashboardIcon name="arrow" /></a></td></tr>)}</tbody></table>{filtered.length === 0 && <DashboardEmpty title="No slides found" text="Upload a slide from the content studio first." />}</div></DashboardCollection>;
}

function TestimonialsView({ data }: { data: Testimonial[] }) {
  return <DashboardCollection title="Testimonials" kicker="Client voices" description="Review social proof yang tampil di situs." actionLabel="Open content studio" actionPath="/admin"><div className="dashboard-quote-grid">{data.map((item) => <article className="dashboard-quote-card" key={item.id}><span className="dashboard-quote-mark">“</span><p>{item.kutipan}</p><footer><strong>{item.nama}</strong><small>{item.jabatan || 'Client'}</small></footer></article>)}</div>{data.length === 0 && <DashboardEmpty title="No testimonials yet" text="Tambahkan testimonial dari content studio." />}</DashboardCollection>;
}

function MessagesView({ data }: { data: Message[] }) {
  const [query, setQuery] = useState('');
  const filtered = data.filter((item) => !query || `${item.nama} ${item.email} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  return <DashboardCollection title="Messages" kicker="Contact inbox" description="Pesan baru dari calon klien dan pengunjung." actionLabel="View public contact" actionPath="/contact"><div className="dashboard-toolbar"><label className="dashboard-search"><DashboardIcon name="search" /><span className="sr-only">Search messages</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages" /></label></div><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Contact</th><th>Email</th><th>Status</th><th>Received</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.nama}</strong></td><td>{item.email}</td><td><span className={`dashboard-status status-${item.status}`}>{item.status}</span></td><td>{item.dibuat_pada ? new Date(item.dibuat_pada).toLocaleDateString('id-ID') : '—'}</td></tr>)}</tbody></table>{filtered.length === 0 && <DashboardEmpty title="Inbox is clear" text="Tidak ada pesan yang cocok." />}</div></DashboardCollection>;
}

function DashboardCollection({ title, kicker, description, actionLabel, actionPath, children }: { title: string; kicker: string; description: string; actionLabel: string; actionPath: string; children: ReactNode }) {
  return <><div className="dashboard-page-heading"><div><p className="dashboard-kicker">{kicker}</p><h1>{title}</h1><p>{description}</p></div><Link className="dashboard-primary-action" to={actionPath}>{actionLabel} <DashboardIcon name="arrow" /></Link></div><section className="dashboard-panel dashboard-collection-panel">{children}</section></>;
}

function DashboardEmpty({ title, text }: { title: string; text: string }) { return <div className="dashboard-empty"><strong>{title}</strong><span>{text}</span></div>; }

export function DashboardApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({ portfolio: [], slides: [], testimonials: [], messages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getOwnerSession();
        const role = session.data.session?.user.app_metadata?.role;
        if (!session.data.session || !['admin', 'owner'].includes(String(role))) { await navigate({ to: '/auth/login', replace: true }); return; }
        const [portfolio, slides, testimonials, messages] = await Promise.all([listOwnerPortfolio(), listSlides(), listTestimonials(), listContactMessages()]);
        if (!cancelled) setData({ portfolio, slides, testimonials, messages: messages as Message[] });
      } catch (caught) { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Dashboard belum dapat dimuat.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [navigate]);
  if (loading) return <div className="dashboard-loading">Loading workspace…</div>;
  if (error) return <div className="dashboard-loading"><strong>Dashboard belum dapat dimuat.</strong><span>{error}</span></div>;
  const path = location.pathname;
  const content = path.includes('/portfolio') || path.includes('/portofoio') ? <PortfolioView data={data.portfolio} /> : path.includes('/slide') ? <SlideView data={data.slides} /> : path.includes('/testimonials') ? <TestimonialsView data={data.testimonials} /> : path.includes('/messages') || path.includes('/contact') ? <MessagesView data={data.messages} /> : <Overview data={data} />;
  const logout = () => void signOutOwner().then(() => navigate({ to: '/auth/login', replace: true }));
  return <div className="dashboard-shell"><DashboardNav pathname={path} onLogout={logout} /><main className="dashboard-main"><header className="dashboard-topbar"><label className="dashboard-global-search"><DashboardIcon name="search" /><input aria-label="Global dashboard search" placeholder="Search workspace" /></label><div className="dashboard-topbar-actions"><span className="dashboard-online"><i /> Live</span><span className="dashboard-user"><span className="dashboard-avatar"><img src="/brand-submark.svg" alt="" aria-hidden="true" /></span><span><strong>Raydiansyah</strong><small>Owner</small></span></span><button className="dashboard-logout dashboard-top-logout" type="button" onClick={logout}><DashboardIcon name="logout" /><span className="sr-only">Log out</span></button></div></header><div className="dashboard-content">{content}</div></main></div>;
}

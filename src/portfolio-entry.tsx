/**
 * Module: Public portfolio data island
 * Purpose: Render published portfolio records from Supabase with client-side filters
 * Used by: React homepage route / and TanStack portfolio route
 * Dependencies: React, TanStack Query, Supabase portofolio RLS policy
 * Public functions: PortfolioDataIsland()
 * Side effects: Performs public Supabase reads; no writes
 */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listPortfolio, type Portfolio, type PortfolioCategory } from './lib/portfolio';

const categories: Array<{ label: string; value?: PortfolioCategory }> = [
  { label: 'All' },
  { label: 'Website', value: 'website' },
  { label: 'Web app', value: 'aplikasi-web' },
  { label: 'Company profile', value: 'company-profile' },
];

function PortfolioCard({ item }: { item: Portfolio }) {
  return <article className="work-card"><div className="work-image" style={item.url_gambar ? { backgroundImage: `url(${item.url_gambar})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><span className="project-tag">{item.kategori} · {item.durasi ?? 'Selected work'}</span>{!item.url_gambar && <span className="image-word">{item.judul.slice(0, 8).toUpperCase()}</span>}</div><div className="work-meta"><h3>{item.judul}</h3><p>{item.ringkasan}</p>{item.url_demo ? <a href={item.url_demo} target="_blank" rel="noreferrer" aria-label={`Buka demo ${item.judul}`}>↗</a> : <span aria-hidden="true">↗</span>}</div></article>;
}

export function PortfolioDataIsland() {
  const [category, setCategory] = useState<PortfolioCategory | undefined>();
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['landing-portfolio', category, search], queryFn: () => listPortfolio({ category, search: search.trim() || undefined }) });
  return <div className="portfolio-data-shell"><div className="filter-row" role="group" aria-label="Filter karya">{categories.map((item) => <button key={item.label} className={`filter ${category === item.value ? 'active' : !category && !item.value ? 'active' : ''}`} aria-pressed={category === item.value || (!category && !item.value)} onClick={() => setCategory(item.value)}>{item.label}{item.value ? null : <span>{query.data?.length ?? '—'}</span>}</button>)}<label className="portfolio-search"><span className="sr-only">Cari portfolio</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari karya…" /></label></div>{query.isLoading && <p className="data-status">Memuat karya dari Supabase…</p>}{query.isError && <p className="data-status data-error">Portfolio belum dapat dimuat. Pastikan env Supabase dan policy public read sudah dikonfigurasi.</p>}{query.data && query.data.length === 0 && <p className="data-status">Belum ada portfolio yang cocok.</p>}{query.data && query.data.length > 0 && <div className="work-grid">{query.data.map((item) => <PortfolioCard key={item.id} item={item} />)}</div>}</div>;
}

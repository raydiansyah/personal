/**
 * Module: Public portfolio data island
 * Purpose: Render published portfolio records as minimal project showcases
 * Used by: React homepage route / and TanStack portfolio route
 * Dependencies: React, TanStack Query, Supabase portofolio RLS policy
 * Public functions: PortfolioDataIsland()
 * Side effects: Performs public Supabase reads; no writes
 */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listPortfolio, listPortfolioCategories, type Portfolio, type PortfolioCategoryOption } from './lib/portfolio';
import { trackPortfolioClick } from './lib/analytics';
import { useLanguage } from './lib/language';
import { t } from './lib/i18n';

function PortfolioCard({ item }: { item: Portfolio }) {
  const { language } = useLanguage();
  const hasDemo = Boolean(item.url_demo && /^https?:\/\//i.test(item.url_demo));
  return <article className="work-card project-showcase"><div className="project-showcase-copy"><h3>{item.judul}</h3><p>{item.ringkasan}</p></div>{hasDemo && <a className="project-showcase-action" href={item.url_demo ?? undefined} target="_blank" rel="noreferrer" onClick={() => void trackPortfolioClick(item.id)}>{language === 'id' ? 'Lihat project' : 'View project'} <span>↗</span></a>}</article>;
}

export function PortfolioDataIsland() {
  const { language } = useLanguage();
  const [category, setCategory] = useState<PortfolioCategoryOption['value']>();
  const [search, setSearch] = useState('');
  const categories = useQuery({ queryKey: ['portfolio-categories'], queryFn: listPortfolioCategories, staleTime: 60_000 });
  const query = useQuery({ queryKey: ['landing-portfolio', category, search], queryFn: () => listPortfolio({ category, search: search.trim() || undefined }) });
  return <div className="portfolio-data-shell"><div className="filter-row" role="group" aria-label={t(language, 'portfolio.filter')}>{(categories.data ?? []).map((item) => <button key={item.label} className={`filter ${category === item.value ? 'active' : !category && !item.value ? 'active' : ''}`} aria-pressed={category === item.value || (!category && !item.value)} onClick={() => setCategory(item.value)}>{item.label}{item.value ? null : <span>{query.data?.length ?? '—'}</span>}</button>)}<label className="portfolio-search"><span className="sr-only">{t(language, 'portfolio.search')}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(language, 'common.search')} /></label></div>{(query.isLoading || categories.isLoading) && <p className="data-status">{t(language, 'portfolio.loading')}</p>}{(query.isError || categories.isError) && <p className="data-status data-error">{t(language, 'portfolio.error')}</p>}{query.data && query.data.length === 0 && <p className="data-status">{t(language, 'portfolio.empty')}</p>}{query.data && query.data.length > 0 && <div className="work-grid">{query.data.map((item) => <PortfolioCard key={item.id} item={item} />)}</div>}</div>;
}

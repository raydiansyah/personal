/**
 * Module: Portfolio preview
 * Purpose: Show a static screenshot or manual cover and fall back to a placeholder
 * Used by: admin portfolio list/form and public landing portfolio cards
 * Dependencies: React; portfolio demo and cover URLs
 * Public functions: PortfolioPreview()
 * Side effects: Loads a remote screenshot/cover image
 */
import { useState } from 'react';
import { getPortfolioPreviewUrl } from '../lib/portfolio-preview';

export function PortfolioPreview({ title, demoUrl, coverUrl, compact = false }: { title: string; demoUrl?: string | null; coverUrl?: string | null; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const usableCoverUrl = coverUrl?.startsWith('http') || coverUrl?.startsWith('data:') ? coverUrl : undefined;
  const height = compact ? 180 : 240;
  const screenshotUrl = getPortfolioPreviewUrl(demoUrl);
  if (screenshotUrl && !failed) return <div className="portfolio-preview" style={{ height }}><img src={screenshotUrl} alt={`Screenshot ${title}`} loading="lazy" onError={() => setFailed(true)} /><span className="portfolio-preview-label">Auto screenshot</span></div>;
  if (usableCoverUrl) return <div className="portfolio-preview" style={{ height, backgroundImage: `url(${usableCoverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}><span className="portfolio-preview-label">Cover</span></div>;
  return <div className="portfolio-preview portfolio-preview-empty" style={{ height }}><span>{title.slice(0, 12).toUpperCase()}</span></div>;
}

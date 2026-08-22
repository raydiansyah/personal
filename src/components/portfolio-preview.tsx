/**
 * Module: Portfolio preview
 * Purpose: Show a live demo preview when embeddable and fall back to a manual cover or placeholder
 * Used by: admin portfolio list/form and public landing portfolio cards
 * Dependencies: React; portfolio demo and cover URLs
 * Public functions: PortfolioPreview()
 * Side effects: Loads the configured demo URL inside a sandboxed iframe
 */
import { useState } from 'react';

export function PortfolioPreview({ title, demoUrl, coverUrl, compact = false }: { title: string; demoUrl?: string | null; coverUrl?: string | null; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const usableCoverUrl = coverUrl?.startsWith('http') || coverUrl?.startsWith('data:') ? coverUrl : undefined;
  const height = compact ? 180 : 240;
  if (demoUrl && !failed) return <div className="portfolio-preview" style={{ height }}><iframe title={`Preview ${title}`} src={demoUrl} loading="lazy" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-scripts allow-same-origin" onError={() => setFailed(true)} /><span className="portfolio-preview-label">Live preview</span></div>;
  if (usableCoverUrl) return <div className="portfolio-preview" style={{ height, backgroundImage: `url(${usableCoverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}><span className="portfolio-preview-label">Cover</span></div>;
  return <div className="portfolio-preview portfolio-preview-empty" style={{ height }}><span>{title.slice(0, 12).toUpperCase()}</span></div>;
}

/**
 * Module: Admin slide preview
 * Purpose: Show a compact preview of an uploaded HTML or PDF slide
 * Used by: Admin dashboard slide table
 * Dependencies: VITE_R2_PUBLIC_BASE_URL and slide storage metadata
 * Public functions: SlidePreview()
 * Side effects: Loads the stored slide asset in a bounded iframe
 */
export function SlidePreview({ title, storagePath, mimeType }: { title: string; storagePath: string; mimeType: string }) {
  const baseUrl = import.meta.env.VITE_R2_PUBLIC_BASE_URL;
  if (!baseUrl) return <span className="muted">No preview</span>;
  const url = `${baseUrl.replace(/\/$/, '')}/${storagePath}`;
  return <div className="slide-preview"><iframe title={`Preview ${title}`} src={url} sandbox={mimeType === 'text/html' ? 'allow-scripts allow-same-origin' : undefined} loading="lazy" /></div>;
}

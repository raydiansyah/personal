/**
 * Module: Portfolio preview image helper
 * Purpose: Build a static screenshot URL for public portfolio demos
 * Used by: admin portfolio form and public portfolio cards
 * Dependencies: Public demo URL and thum.io screenshot endpoint
 * Public functions: getPortfolioPreviewUrl()
 * Side effects: None; returns a remote image URL without opening the demo in an iframe
 */
export function getPortfolioPreviewUrl(demoUrl: string | null | undefined): string | undefined {
  if (!demoUrl) return undefined;
  try {
    const url = new URL(demoUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return `https://image.thum.io/get/width/1200/crop/800/noanimate/${encodeURIComponent(url.toString())}`;
  } catch {
    return undefined;
  }
}

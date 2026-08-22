/**
 * Module: Landing sharing interactions
 * Purpose: Provide privacy-safe share actions without fake backend responses
 * Used by: index.html
 * Dependencies: Browser Web Share API, Clipboard API, optional window.gtag
 * Public functions: initPromotions()
 * Side effects: Opens native share/mail fallback and writes the current URL to clipboard
 */
function trackPromotion(name) { if (typeof window.gtag === 'function') window.gtag('event', name, { page_location: window.location.pathname }); }
function initPromotions() {
  const contact = document.querySelector('#contact');
  if (!contact) return;
  const pageUrl = window.location.href;
  contact.insertAdjacentHTML('beforebegin', '<div class="section-wrap promotion-strip"><p>Found this useful? Share it with someone building their next thing.</p><div class="share-actions"><button type="button" data-share="copy">Copy link</button><button type="button" data-share="native">Share ↗</button></div></div>');
  document.querySelector('[data-share="copy"]')?.addEventListener('click', async (event) => { try { await navigator.clipboard.writeText(pageUrl); event.currentTarget.textContent = 'Copied ✓'; } catch { window.location.href = `mailto:?subject=raydiansyah.com&body=${encodeURIComponent(pageUrl)}`; } trackPromotion('share_copy'); });
  document.querySelector('[data-share="native"]')?.addEventListener('click', async () => { if (navigator.share) await navigator.share({ title: document.title, text: 'raydiansyah.com portfolio', url: pageUrl }); else window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`, '_blank', 'noopener'); trackPromotion('share_native'); });
}
initPromotions();

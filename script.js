/**
 * Module: Landing shell interactions
 * Purpose: Manage theme preference, mobile navigation, and privacy-safe CTA analytics
 * Used by: index.html
 * Dependencies: Browser DOM APIs; analytics helper
 * Public functions: setTheme()
 * Side effects: Mutates navigation/theme state, writes one local theme preference, loads optional GA4, and injects JSON-LD
 */
import { initAnalytics } from './src/lib/analytics.ts';

initAnalytics();

if (!document.querySelector('script[data-structured-data="professional-service"]')) {
  const structuredData = document.createElement('script');
  structuredData.type = 'application/ld+json';
  structuredData.dataset.structuredData = 'professional-service';
  structuredData.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'raydiansyah.com',
    url: 'https://raydiansyah.com/',
    description: 'Website dan aplikasi web untuk bisnis yang sedang bertumbuh.',
    areaServed: 'Indonesia',
    serviceType: ['Website', 'Web application', 'Company profile'],
  });
  document.head.appendChild(structuredData);
}

const themeToggle = document.querySelector('.theme-toggle');
const themeLabel = themeToggle?.querySelector('.theme-label');
const initialTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

function syncThemeControl(theme) {
  const isDark = theme === 'dark';
  themeToggle?.setAttribute('aria-pressed', String(isDark));
  themeToggle?.setAttribute('aria-label', isDark ? 'Aktifkan light mode' : 'Aktifkan dark mode');
  if (themeLabel) themeLabel.textContent = isDark ? 'Dark' : 'Light';
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  syncThemeControl(document.documentElement.dataset.theme);
  window.localStorage.setItem('raydiansyah-theme', document.documentElement.dataset.theme);
}

syncThemeControl(initialTheme);
themeToggle?.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

document.querySelector('.menu-toggle')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  const nav = document.querySelector('.desktop-nav');
  const open = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('mobile-open', !open);
  if (!open) nav?.querySelector('a')?.focus();
});

document.querySelectorAll('.desktop-nav a').forEach((link) => link.addEventListener('click', () => {
  document.querySelector('.desktop-nav')?.classList.remove('mobile-open');
  document.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false');
}));

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  document.querySelector('.desktop-nav')?.classList.remove('mobile-open');
  document.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false');
  document.querySelector('.menu-toggle')?.focus();
});

const year = document.querySelector('#copyright-year');
if (year) year.textContent = String(new Date().getFullYear());

const trackConversion = (name) => { if (typeof window.gtag === 'function') window.gtag('event', name, { page_location: window.location.pathname }); };
document.querySelectorAll('[data-conversion="whatsapp_click"]').forEach((link) => link.addEventListener('click', () => trackConversion('whatsapp_click')));

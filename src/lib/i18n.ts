/**
 * Module: Public interface translations
 * Purpose: Centralize English/Indonesian UI copy for public and recovery states
 * Used by: Public pages, shared widgets, and authentication screens
 * Dependencies: src/lib/language.tsx
 * Public functions: t()
 * Side effects: None
 */
import type { Language } from './language';

const translations = {
  id: {
    'error.eyebrow': 'Sesuatu berjalan di luar skrip', 'error.notFoundTitle': 'Halaman ini tidak ditemukan.',
    'error.notFoundMessage': 'Rute mungkin sudah berpindah atau tautannya sudah tidak berlaku. Mari kembali ke halaman yang berguna.',
    'error.routeTitle': 'Terjadi kendala pada halaman.', 'error.routeMessage': 'Terjadi kesalahan saat memuat rute ini. Coba lagi atau kembali ke beranda.',
    'error.home': 'Kembali ke beranda ↗', 'error.retry': 'Coba lagi ↻',
    'captcha.missing': 'CAPTCHA belum dikonfigurasi.', 'captcha.loadFailed': 'Turnstile gagal dimuat.',
    'captcha.verifyFailed': 'CAPTCHA tidak dapat diverifikasi. Coba lagi.', 'captcha.unavailable': 'CAPTCHA tidak dapat dimuat.', 'captcha.label': 'Verifikasi CAPTCHA',
    'share.prompt': 'Bermanfaat? Bagikan kepada seseorang yang sedang membangun produk berikutnya.', 'share.copy': 'Salin tautan', 'share.share': 'Bagikan ↗', 'share.copied': 'Tautan tersalin.', 'share.title': 'portfolio raydiansyah.com',
    'common.loading': 'Memuat…', 'common.search': 'Cari…', 'common.back': 'Kembali', 'common.home': 'Beranda', 'common.open': 'Buka ↗', 'common.retry': 'Coba lagi',
    'portfolio.eyebrow': 'Karya terpilih', 'portfolio.title': 'Karya yang menggerakkan bisnis.', 'portfolio.search': 'Cari portfolio', 'portfolio.searchPlaceholder': 'Cari judul atau teknologi', 'portfolio.loading': 'Memuat portfolio…', 'portfolio.error': 'Portfolio belum dapat dimuat. Periksa koneksi Supabase.', 'portfolio.empty': 'Belum ada portfolio yang dipublikasikan.', 'portfolio.filter': 'Filter karya', 'portfolio.demo': 'Buka demo', 'portfolio.detailEyebrow': 'Case terpilih', 'portfolio.discuss': 'Diskusikan project serupa', 'portfolio.visit': 'Kunjungi demo', 'portfolio.back': 'Kembali ke karya',
    'slide.title': 'Presentasi', 'slide.notFound': 'Slide tidak ditemukan.', 'slide.home': 'Kembali ke beranda', 'slide.unconfigured': 'Slide belum dikonfigurasi.', 'slide.r2Missing': 'VITE_R2_PUBLIC_BASE_URL belum tersedia pada deployment ini.',
    'contact.captcha': 'Selesaikan CAPTCHA terlebih dahulu.', 'contact.submit': 'Kirim inquiry',
    'auth.ownerAccess': 'Akses owner', 'auth.studio': 'Admin studio.', 'auth.email': 'Email owner', 'auth.password': 'Password', 'auth.signIn': 'Masuk ↗', 'auth.noAccess': 'Akun ini tidak memiliki akses admin.', 'auth.envMissing': 'Environment Supabase belum dikonfigurasi.', 'auth.loginFailed': 'Login gagal.',
  },
  en: {
    'error.eyebrow': 'Something went off-script', 'error.notFoundTitle': 'This page is not here.',
    'error.notFoundMessage': 'The route may have moved, or the link may be out of date. Let’s get you back to something useful.',
    'error.routeTitle': 'The page hit an unexpected edge.', 'error.routeMessage': 'Something failed while loading this route. Try again, or return to the homepage.',
    'error.home': 'Back to home ↗', 'error.retry': 'Try again ↻',
    'captcha.missing': 'CAPTCHA is not configured.', 'captcha.loadFailed': 'Turnstile failed to load.',
    'captcha.verifyFailed': 'CAPTCHA could not be verified. Try again.', 'captcha.unavailable': 'CAPTCHA could not be loaded.', 'captcha.label': 'CAPTCHA verification',
    'share.prompt': 'Found this useful? Share it with someone building their next thing.', 'share.copy': 'Copy link', 'share.share': 'Share ↗', 'share.copied': 'Link copied.', 'share.title': 'raydiansyah.com portfolio',
    'common.loading': 'Loading…', 'common.search': 'Search…', 'common.back': 'Back', 'common.home': 'Home', 'common.open': 'Open ↗', 'common.retry': 'Try again',
    'portfolio.eyebrow': 'Selected work', 'portfolio.title': 'Work that moves business forward.', 'portfolio.search': 'Search portfolio', 'portfolio.searchPlaceholder': 'Search title or technology', 'portfolio.loading': 'Loading portfolio…', 'portfolio.error': 'Portfolio could not be loaded. Check the Supabase connection.', 'portfolio.empty': 'No published portfolio yet.', 'portfolio.filter': 'Filter work', 'portfolio.demo': 'Open demo', 'portfolio.detailEyebrow': 'Selected case', 'portfolio.discuss': 'Discuss a similar project', 'portfolio.visit': 'Visit demo', 'portfolio.back': 'Back to work',
    'slide.title': 'Presentation', 'slide.notFound': 'Slide not found.', 'slide.home': 'Back to home', 'slide.unconfigured': 'This slide is not configured.', 'slide.r2Missing': 'VITE_R2_PUBLIC_BASE_URL is not available in this deployment.',
    'contact.captcha': 'Complete the CAPTCHA first.', 'contact.submit': 'Send inquiry',
    'auth.ownerAccess': 'Owner access', 'auth.studio': 'Admin studio.', 'auth.email': 'Owner email', 'auth.password': 'Password', 'auth.signIn': 'Sign in ↗', 'auth.noAccess': 'This account does not have admin access.', 'auth.envMissing': 'Supabase environment is not configured.', 'auth.loginFailed': 'Login failed.',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
export function t(language: Language, key: TranslationKey): string { return translations[language][key] ?? translations.en[key]; }

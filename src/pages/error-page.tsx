/**
 * Module: Route error pages
 * Purpose: Provide branded recovery screens for missing routes and unexpected route failures
 * Used by: TanStack root route notFoundComponent and errorComponent
 * Dependencies: TanStack Router Link and shared project tokens
 * Public functions: NotFoundPage(), RouteErrorPage()
 * Side effects: Reloads the current document when the retry action is selected
 */
import { Link } from '@tanstack/react-router';
import { useLanguage } from '../lib/language';
import { t } from '../lib/i18n';

function ErrorPage({ code, title, message, retry }: { code: string; title: (language: Parameters<typeof t>[0]) => string; message: (language: Parameters<typeof t>[0]) => string; retry?: boolean }) {
  const { language } = useLanguage();
  return <main className="error-page" aria-labelledby="error-title"><div className="error-page-inner"><p className="eyebrow">{code} / {t(language, 'error.eyebrow')}</p><h1 id="error-title">{title(language)}</h1><p className="lede">{message(language)}</p><div className="error-page-actions"><Link className="button primary" to="/">{t(language, 'error.home')}</Link>{retry && <button className="button" type="button" onClick={() => window.location.reload()}>{t(language, 'error.retry')}</button>}</div></div></main>;
}

export function NotFoundPage() { return <ErrorPage code="404" title={(language) => t(language, 'error.notFoundTitle')} message={(language) => t(language, 'error.notFoundMessage')} />; }
export function RouteErrorPage() { return <ErrorPage code="500" title={(language) => t(language, 'error.routeTitle')} message={(language) => t(language, 'error.routeMessage')} retry />; }

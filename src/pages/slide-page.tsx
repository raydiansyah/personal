/**
 * Module: Public presentation page
 * Purpose: Render approved HTML/PDF slides through a custom public slug
 * Used by: TanStack route /s/$slug
 * Dependencies: TanStack Query/Router, Cloudflare R2 public URL, slide service
 * Public functions: SlidePage()
 * Side effects: Public Supabase read and sandboxed iframe navigation; shows configuration error when R2 public URL is absent
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { getSlideBySlug, SlideAccessError } from "../lib/slides";
import { useLanguage } from "../lib/language";
import { t } from "../lib/i18n";

export function SlidePage() {
  const { language } = useLanguage();
  const { slug } = useParams({ strict: false }) as { slug?: string };
  const [activeSlug, setActiveSlug] = useState(slug ?? "");
  const [accessCode, setAccessCode] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const viewerRef = useRef<HTMLDivElement>(null);
  const preserveFullscreenRef = useRef(false);
  const navigationPendingRef = useRef(false);
  const result = useQuery({
    queryKey: ["slide", activeSlug, submittedCode],
    queryFn: () => getSlideBySlug(activeSlug, submittedCode),
    placeholderData: (previous) => previous,
  });
  const context = result.data;
  const slide = context?.slide;

  useEffect(() => {
    if (slug && window.location.pathname === `/s/${encodeURIComponent(slug)}` && slug !== activeSlug) setActiveSlug(slug);
  }, [activeSlug, slug]);

  useEffect(() => {
    function handlePopState() {
      const nextSlug = window.location.pathname.match(/^\/s\/([^/]+)/)?.[1];
      if (nextSlug) setActiveSlug(decodeURIComponent(nextSlug));
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      if (document.fullscreenElement !== viewerRef.current && !navigationPendingRef.current) preserveFullscreenRef.current = false;
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!slide || !preserveFullscreenRef.current || document.fullscreenElement) return;
    const frame = window.requestAnimationFrame(() => {
      void viewerRef.current?.requestFullscreen().then(() => {
        navigationPendingRef.current = false;
      }).catch(() => {
        preserveFullscreenRef.current = false;
        navigationPendingRef.current = false;
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [slide]);

  function goToSlide(destinationSlug: string) {
    setActiveSlug(destinationSlug);
    window.history.pushState({}, "", `/s/${encodeURIComponent(destinationSlug)}`);
  }

  useEffect(() => {
    function handleKeyboardNavigation(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "Escape") {
        preserveFullscreenRef.current = false;
        navigationPendingRef.current = false;
        if (document.fullscreenElement) void document.exitFullscreen();
        return;
      }
      if (!context || !slide || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      const index = context.slides.findIndex((item) => item.id === slide.id);
      const destination = event.key === "ArrowRight" ? context.slides[index + 1] : context.slides[index - 1];
      if (!destination) return;
      event.preventDefault();
      preserveFullscreenRef.current = Boolean(document.fullscreenElement);
      navigationPendingRef.current = preserveFullscreenRef.current;
      goToSlide(destination.slug);
    }
    window.addEventListener("keydown", handleKeyboardNavigation);
    return () => window.removeEventListener("keydown", handleKeyboardNavigation);
  }, [context, slide]);

  function submitAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedCode(accessCode.trim());
  }

  async function toggleFullscreen() {
    if (!viewerRef.current) return;
    if (document.fullscreenElement) {
      preserveFullscreenRef.current = false;
      navigationPendingRef.current = false;
      await document.exitFullscreen();
    } else {
      preserveFullscreenRef.current = true;
      navigationPendingRef.current = false;
      await viewerRef.current.requestFullscreen();
    }
  }

  function keepFullscreenOnNavigation() {
    preserveFullscreenRef.current = Boolean(document.fullscreenElement);
    navigationPendingRef.current = preserveFullscreenRef.current;
  }

  const accessError = result.error instanceof SlideAccessError ? result.error.code : null;
  if (result.isLoading) return <section className="page section"><p className="eyebrow">{t(language, "slide.title")}</p><h1>{language === "id" ? "Memuat slide…" : "Loading slide…"}</h1></section>;
  if (accessError === "access_required" || accessError === "invalid_access_code")
    return <section className="page section"><p className="eyebrow">{t(language, "slide.title")}</p><h1>{language === "id" ? "Masukkan kode akses." : "Enter the access code."}</h1><p className="lede">{language === "id" ? "Material ini menggunakan kode akses untuk membuka rangkaian slide." : "This material uses an access code to open its slide collection."}</p><form className="slide-access-form" onSubmit={submitAccess}><label><span className="sr-only">{language === "id" ? "Kode akses" : "Access code"}</span><input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder={language === "id" ? "Kode akses" : "Access code"} autoComplete="one-time-code" required /></label><button className="button primary" type="submit">{language === "id" ? "Buka slide" : "Unlock slides"} ↗</button>{accessError === "invalid_access_code" && <p className="status" role="alert">{language === "id" ? "Kode akses tidak valid." : "The access code is invalid."}</p>}</form></section>;
  if (accessError === "access_expired") return <section className="page section"><p className="eyebrow">{t(language, "slide.title")}</p><h1>{language === "id" ? "Kode akses sudah expired." : "This access code has expired."}</h1><p className="lede">{language === "id" ? "Minta kode baru kepada pemilik material." : "Ask the material owner for a new access code."}</p><Link className="button" to="/">{t(language, "slide.home")}</Link></section>;
  if (accessError === "slide_access_failed") return <section className="page section"><p className="eyebrow">{t(language, "slide.title")}</p><h1>{language === "id" ? "Slide belum dapat dibuka." : "The slide could not be opened."}</h1><p className="lede">{language === "id" ? "Pastikan Edge Function verifikasi slide sudah dideploy." : "Make sure the slide verification Edge Function is deployed."}</p><Link className="button" to="/">{t(language, "slide.home")}</Link></section>;

  if (!slide)
    return (
      <section className="page section">
        <p className="eyebrow">{t(language, 'slide.title')}</p>
        <h1>{t(language, 'slide.notFound')}</h1>
        <Link className="button" to="/">
          {t(language, 'slide.home')}
        </Link>
      </section>
    );

  const baseUrl = import.meta.env.VITE_R2_PUBLIC_BASE_URL;
  if (!baseUrl)
    return (
      <section className="page section">
        <p className="eyebrow">{t(language, 'slide.title')}</p>
        <h1>{t(language, 'slide.unconfigured')}</h1>
        <p className="lede">
          {t(language, 'slide.r2Missing')}
        </p>
        <Link className="button" to="/">
          {t(language, 'slide.home')}
        </Link>
      </section>
    );

  const url = `${baseUrl.replace(/\/$/, "")}/${slide.storage_path}`;
  return (
    <section className="page section">
      <p className="eyebrow">{t(language, 'slide.title')} · {slide.mime_type}</p>
      <h1>{slide.judul}</h1>
      <div ref={viewerRef} className="slide-viewer-shell">
        <div className="slide-viewer-toolbar"><span>{language === "id" ? "Material slide" : "Slide material"}</span><button className="button" type="button" onClick={() => void toggleFullscreen()}>{language === "id" ? "Layar penuh" : "Fullscreen"} ⛶</button></div>
      <div
        style={{
          minHeight: "70vh",
          border: "1px solid #ffffff20",
          borderRadius: 24,
          overflow: "hidden",
        }}
      >
        <iframe
          title={slide.judul}
          src={url}
          sandbox={
            slide.mime_type === "text/html" ? "allow-scripts" : undefined
          }
          style={{ width: "100%", height: "70vh", border: 0 }}
          allowFullScreen
        />
      </div>
      {context && context.slides.length > 1 && (() => { const index = context.slides.findIndex((item) => item.id === slide.id); const previous = index > 0 ? context.slides[index - 1] : null; const next = index >= 0 && index < context.slides.length - 1 ? context.slides[index + 1] : null; return <nav className="slide-navigation" aria-label={language === "id" ? "Navigasi slide" : "Slide navigation"}><div>{previous ? <button className="button" type="button" onClick={() => { keepFullscreenOnNavigation(); goToSlide(previous.slug); }}>← {language === "id" ? "Sebelumnya" : "Previous"}</button> : <span />}</div><span className="slide-position">{index + 1} / {context.slides.length}</span><div>{next ? <button className="button primary" type="button" onClick={() => { keepFullscreenOnNavigation(); goToSlide(next.slug); }}>{language === "id" ? "Berikutnya" : "Next"} →</button> : <span />}</div></nav>; })()}
      </div>
    </section>
  );
}

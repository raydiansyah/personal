/**
 * Module: Public presentation page
 * Purpose: Render approved HTML/PDF slides with learning-path navigation and presentation annotations
 * Used by: TanStack route /s/$slug
 * Dependencies: TanStack Query/Router, Cloudflare R2 public URL, slide service
 * Public functions: SlidePage()
 * Side effects: Public Supabase read, browser fullscreen, canvas drawing, and sandboxed iframe navigation; no annotation persistence
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { getSlideBySlug, SlideAccessError } from "../lib/slides";
import { useLanguage } from "../lib/language";
import { t } from "../lib/i18n";

type PresentationTool = "none" | "laser" | "draw";
type DrawingSnapshot = { data: string; hasDrawing: boolean };

function PresentationIcon({ name }: { name: "laser" | "draw" | "fullscreen" | "more" }) {
  const paths = {
    laser: "M4 20 20 4M7 4h3M4 7v3M17 20h3v-3",
    draw: "m4 16 3.5-.7L18 4.8a2 2 0 0 1 2.8 2.8L10.3 18.5 4 20l1.5-6.3L16.8 2.4",
    fullscreen: "M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5",
    more: "M5 12h.01M12 12h.01M19 12h.01",
  } as const;

  return (
    <svg className="slide-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

export function SlidePage() {
  const { language } = useLanguage();
  const { slug } = useParams({ strict: false }) as { slug?: string };
  const [activeSlug, setActiveSlug] = useState(slug ?? "");
  const [accessCode, setAccessCode] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [presentationTool, setPresentationTool] = useState<PresentationTool>("none");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [annotationColor, setAnnotationColor] = useState("#ff8a65");
  const [drawingHistory, setDrawingHistory] = useState<DrawingSnapshot[]>([]);
  const [drawingFuture, setDrawingFuture] = useState<DrawingSnapshot[]>([]);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [laserPosition, setLaserPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preserveFullscreenRef = useRef(false);
  const navigationPendingRef = useRef(false);
  const drawingBeforeRef = useRef<DrawingSnapshot | null>(null);
  const result = useQuery({
    queryKey: ["slide", activeSlug, submittedCode],
    queryFn: () => getSlideBySlug(activeSlug, submittedCode),
    placeholderData: (previous) => previous,
  });
  const context = result.data;
  const slide = context?.slide;
  const material = context?.material;

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
      if (!context || !slide || (!event.metaKey && !event.ctrlKey) || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
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

  function resizeCanvas() {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const bounds = stage.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;
    canvas.getContext("2d")?.scale(ratio, ratio);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    canvas.getContext("2d")?.clearRect(0, 0, stage.clientWidth, stage.clientHeight);
  }

  function snapshotDrawing(): DrawingSnapshot | null {
    const canvas = canvasRef.current;
    return canvas ? { data: canvas.toDataURL(), hasDrawing } : null;
  }

  function restoreDrawing(snapshot: DrawingSnapshot) {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    clearCanvas();
    if (!snapshot.hasDrawing) {
      setHasDrawing(false);
      return;
    }
    const image = new Image();
    image.onload = () => {
      canvas.getContext("2d")?.drawImage(image, 0, 0, stage.clientWidth, stage.clientHeight);
      setHasDrawing(true);
    };
    image.src = snapshot.data;
  }

  function clearDrawing() {
    const current = snapshotDrawing();
    if (!current || !hasDrawing) return;
    setDrawingHistory((history) => [...history, current]);
    setDrawingFuture([]);
    clearCanvas();
    setHasDrawing(false);
  }

  useEffect(() => {
    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    if (stageRef.current) observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [slide]);

  useEffect(() => {
    clearCanvas();
    setHasDrawing(false);
    setDrawingHistory([]);
    setDrawingFuture([]);
    setZoom(1);
    setToolsOpen(false);
    setLaserPosition(null);
    setPresentationTool("none");
  }, [activeSlug]);

  function getStagePoint(event: ReactPointerEvent<HTMLDivElement | HTMLCanvasElement>) {
    const bounds = stageRef.current?.getBoundingClientRect();
    return bounds ? { x: event.clientX - bounds.left, y: event.clientY - bounds.top } : null;
  }

  function handleLaserMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (presentationTool !== "laser") return;
    setLaserPosition(getStagePoint(event));
  }

  function startDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (presentationTool !== "draw") return;
    const point = getStagePoint(event);
    const context = canvasRef.current?.getContext("2d");
    if (!point || !context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingBeforeRef.current = snapshotDrawing();
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.strokeStyle = annotationColor;
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    setIsDrawing(true);
  }

  function undoDrawing() {
    const previous = drawingHistory.at(-1);
    const current = snapshotDrawing();
    if (!previous || !current) return;
    setDrawingFuture((future) => [...future, current]);
    setDrawingHistory((history) => history.slice(0, -1));
    restoreDrawing(previous);
  }

  function redoDrawing() {
    const next = drawingFuture.at(-1);
    const current = snapshotDrawing();
    if (!next || !current) return;
    setDrawingHistory((history) => [...history, current]);
    setDrawingFuture((future) => future.slice(0, -1));
    restoreDrawing(next);
  }

  function draw(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || presentationTool !== "draw") return;
    const point = getStagePoint(event);
    const context = canvasRef.current?.getContext("2d");
    if (!point || !context) return;
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (isDrawing && drawingBeforeRef.current) {
      setDrawingHistory((history) => [...history, drawingBeforeRef.current as DrawingSnapshot]);
      setDrawingFuture([]);
      setHasDrawing(true);
    }
    drawingBeforeRef.current = null;
    setIsDrawing(false);
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
        <div className="slide-viewer-toolbar">
          <div className="slide-viewer-context"><span>{language === "id" ? "Material slide" : "Slide material"}</span>{material && <strong title={material.deskripsi || material.judul}>{material.judul}</strong>}</div>
          <div className="slide-presenter-tools" aria-label={language === "id" ? "Alat presentasi" : "Presentation tools"}>
            <div className="slide-tools-menu">
              <button className={`button slide-tools-trigger ${toolsOpen ? "active" : ""}`} type="button" title={language === "id" ? "Alat slide" : "Slide tools"} aria-label={language === "id" ? "Buka alat slide" : "Open slide tools"} aria-expanded={toolsOpen} onClick={() => setToolsOpen((current) => !current)}><PresentationIcon name="more" /></button>
              {toolsOpen && <div className="slide-tools-popover" role="menu" aria-label={language === "id" ? "Alat slide" : "Slide tools"}>
                <button className={`slide-tool-menu-item ${presentationTool === "laser" ? "active" : ""}`} type="button" role="menuitem" onClick={() => { setPresentationTool((current) => current === "laser" ? "none" : "laser"); setToolsOpen(false); }}><PresentationIcon name="laser" /><span>Laser</span></button>
                <button className={`slide-tool-menu-item ${presentationTool === "draw" ? "active" : ""}`} type="button" role="menuitem" onClick={() => { setPresentationTool((current) => current === "draw" ? "none" : "draw"); setToolsOpen(false); }}><PresentationIcon name="draw" /><span>{language === "id" ? "Coret" : "Draw"}</span></button>
              </div>}
            </div>
            <label className="slide-color-control slide-color-picker">{language === "id" ? "Warna coretan" : "Ink color"}<input type="color" value={annotationColor} onChange={(event) => setAnnotationColor(event.target.value)} aria-label={language === "id" ? "Warna coretan" : "Ink color"} /></label>
            {hasDrawing && <button className="button" type="button" onClick={clearDrawing}>{language === "id" ? "Hapus coretan" : "Clear drawing"}</button>}
            <div className="slide-history-actions" role="group" aria-label={language === "id" ? "Riwayat coretan" : "Drawing history"}><button className="button" type="button" onClick={undoDrawing} disabled={!drawingHistory.length} title="Undo" aria-label="Undo">↶</button><button className="button" type="button" onClick={redoDrawing} disabled={!drawingFuture.length} title="Redo" aria-label="Redo">↷</button></div>
            <div className="slide-zoom-actions" role="group" aria-label={language === "id" ? "Zoom slide" : "Slide zoom"}><button className="button" type="button" onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(1))))} title="Zoom out" aria-label="Zoom out">−</button><span>{Math.round(zoom * 100)}%</span><button className="button" type="button" onClick={() => setZoom((value) => Math.min(1.5, Number((value + 0.1).toFixed(1))))} title="Zoom in" aria-label="Zoom in">+</button></div>
            <button className="button slide-fullscreen-button" type="button" title={language === "id" ? "Layar penuh" : "Fullscreen"} aria-label={language === "id" ? "Layar penuh" : "Fullscreen"} onClick={() => void toggleFullscreen()}><PresentationIcon name="fullscreen" /></button>
          </div>
        </div>
      <div ref={stageRef} className="slide-viewer-stage" onPointerMove={handleLaserMove} onPointerLeave={() => setLaserPosition(null)}>
        <iframe
          title={slide.judul}
          src={url}
          sandbox={
            slide.mime_type === "text/html" ? "allow-scripts allow-same-origin" : undefined
          }
          scrolling="yes"
          style={{ width: "100%", height: "70vh", border: 0, touchAction: "pan-y", WebkitOverflowScrolling: "touch", transform: `scale(${zoom})`, transformOrigin: "center center" }}
          allow="fullscreen"
          allowFullScreen
        />
        <div className={`slide-laser-layer ${presentationTool === "laser" ? "is-active" : ""}`} aria-hidden="true" onPointerMove={handleLaserMove} />
        <canvas ref={canvasRef} className={`slide-annotation-canvas ${presentationTool === "draw" ? "is-active" : ""}`} onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} aria-label={language === "id" ? "Kanvas coretan" : "Drawing canvas"} />
        {presentationTool === "laser" && laserPosition && <span className="slide-laser-dot" style={{ left: laserPosition.x, top: laserPosition.y }} aria-hidden="true" />}
      </div>
      {context && context.slides.length > 1 && (() => { const index = context.slides.findIndex((item) => item.id === slide.id); const previous = index > 0 ? context.slides[index - 1] : null; const next = index >= 0 && index < context.slides.length - 1 ? context.slides[index + 1] : null; return <>
        <nav className="slide-navigation" aria-label={language === "id" ? "Navigasi slide" : "Slide navigation"}><div>{previous ? <button className="button" type="button" onClick={() => { keepFullscreenOnNavigation(); goToSlide(previous.slug); }}>← {language === "id" ? "Sebelumnya" : "Previous"}</button> : <span />}</div><span className="slide-position">{index + 1} / {context.slides.length}</span><div>{next ? <button className="button primary" type="button" onClick={() => { keepFullscreenOnNavigation(); goToSlide(next.slug); }}>{language === "id" ? "Berikutnya" : "Next"} →</button> : <span />}</div></nav>
        <nav className="slide-learning-path" aria-label={language === "id" ? "Learning path" : "Learning path"}><span className="slide-learning-path-label">{language === "id" ? "Learning path" : "Learning path"}</span><div className="slide-learning-path-list">{context.slides.map((item, itemIndex) => <button key={item.id} className={`slide-learning-path-item ${item.id === slide.id ? "active" : ""}`} type="button" aria-current={item.id === slide.id ? "step" : undefined} onClick={() => { if (item.id === slide.id) return; keepFullscreenOnNavigation(); goToSlide(item.slug); }}><span>{String(itemIndex + 1).padStart(2, "0")}</span><strong>{item.judul}</strong></button>)}</div></nav>
      </>; })()}
      </div>
    </section>
  );
}

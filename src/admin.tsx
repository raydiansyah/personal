/**
 * Module: Owner admin application
 * Purpose: Authenticate owner and manage portfolio, testimonials, slides, and contact inbox
 * Used by: TanStack route /auth/login
 * Dependencies: React, Supabase owner data service, Cloudflare Turnstile widget, app.css
 * Public functions: AdminApp()
 * Side effects: Auth session, role-gated database CRUD, and R2 presigned uploads through RLS
 */
import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  createPortfolio,
  createTestimonial,
  deletePortfolio,
  getOwnerSession,
  listContactMessages,
  listOwnerPortfolio,
  listSlides,
  listTestimonials,
  signInOwner,
  signOutOwner,
  slugify,
  uploadPortfolioCover,
  uploadSlide,
  type Slide,
  type Testimonial,
  type UploadProgress,
} from "./lib/admin";
import type { Portfolio } from "./lib/portfolio";
import { APP_VERSION } from "./lib/version";
import { TurnstileWidget } from "./components/turnstile-widget";
import { isTurnstileEnabled } from "./lib/turnstile";
import { PortfolioPreview } from "./components/portfolio-preview";
import { getPortfolioPreviewUrl } from "./lib/portfolio-preview";
import { SlidePreview } from "./components/slide-preview";
import { useLanguage } from "./lib/language";
import { t } from "./lib/i18n";
import {
  formatFileSize,
  PORTFOLIO_COVER_RULE,
  SLIDE_RULE,
  validateUploadFile,
} from "./lib/file-validation";
import "./app.css";
import "./admin-upload.css";

type Message = { id: string; nama: string; email: string; status: string };
export function AdminApp() {
  const { language } = useLanguage();
  const [session, setSession] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [items, setItems] = useState<Portfolio[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("");
  const [slideTitle, setSlideTitle] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [portfolioQuery, setPortfolioQuery] = useState("");
  const [portfolioCategory, setPortfolioCategory] = useState("");
  const [slideQuery, setSlideQuery] = useState("");
  const [slideMime, setSlideMime] = useState("");
  const [projectCover, setProjectCover] = useState<File | null>(null);
  const [coverError, setCoverError] = useState("");
  const [slideFileError, setSlideFileError] = useState("");
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [previewPortfolio, setPreviewPortfolio] = useState<Portfolio | null>(
    null,
  );
  const [previewSlide, setPreviewSlide] = useState<Slide | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  async function load() {
    try {
      const current = await getOwnerSession();
      const role = current.data.session?.user.app_metadata?.role;
      const isAdmin = role === "admin" || role === "owner";
      if (current.data.session && !isAdmin) {
        await signOutOwner();
        setSession(false);
        setStatus(t(language, "auth.noAccess"));
        return;
      }
      setSession(Boolean(current.data.session));
      if (current.data.session && location.pathname === "/auth/login")
        await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : t(language, "auth.envMissing"),
      );
    }
  }
  useEffect(() => {
    void load();
  }, [location.pathname]);
  useEffect(() => {
    const closePreview = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewPortfolio(null);
        setPreviewSlide(null);
      }
    };
    window.addEventListener("keydown", closePreview);
    return () => window.removeEventListener("keydown", closePreview);
  }, []);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    if (isTurnstileEnabled() && !captchaToken) {
      setStatus(t(language, "contact.captcha"));
      return;
    }
    try {
      const result = await signInOwner(email, password, captchaToken);
      if (result.error) throw result.error;
      const role = result.data.user?.app_metadata?.role;
      if (role !== "admin" && role !== "owner") {
        await signOutOwner();
        throw new Error(t(language, "auth.noAccess"));
      }
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t(language, "auth.loginFailed"));
    } finally {
      setCaptchaToken("");
      setCaptchaKey((value) => value + 1);
    }
  }
  async function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const coverValidationError = projectCover
      ? validateUploadFile(projectCover, PORTFOLIO_COVER_RULE)
      : "";
    if (coverValidationError) {
      setCoverError(coverValidationError);
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const slug = slugify(String(form.get("slug")));
      const demoUrl = String(form.get("url_demo") ?? "").trim() || null;
      const coverUrl = projectCover
        ? await uploadPortfolioCover(projectCover, slug)
        : String(form.get("url_gambar") ?? "").trim() ||
          getPortfolioPreviewUrl(demoUrl) ||
          null;
      await createPortfolio({
        judul: String(form.get("judul")),
        slug,
        kategori: String(form.get("kategori")) as Portfolio["kategori"],
        ringkasan: String(form.get("ringkasan")),
        url_demo: demoUrl,
        url_gambar: coverUrl,
      });
      formElement.reset();
      setProjectTitle("");
      setProjectUrl("");
      setProjectCover(null);
      setCoverError("");
      await load();
      setStatus("Portfolio tersimpan.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Gagal menyimpan portfolio.",
      );
    }
  }
  async function removeProject(id: string) {
    if (!window.confirm("Sembunyikan portfolio ini dari publik?")) return;
    try {
      await deletePortfolio(id);
      await load();
      setStatus("Portfolio disembunyikan.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Gagal mengubah portfolio.",
      );
    }
  }
  async function addTestimonial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    try {
      await createTestimonial({
        nama: String(form.get("nama")),
        jabatan: String(form.get("jabatan")),
        kutipan: String(form.get("kutipan")),
      });
      target.reset();
      await load();
      setStatus("Testimonial tersimpan.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Gagal menyimpan testimonial.",
      );
    }
  }
  async function addSlide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");
    const title = String(form.get("judul") ?? "").trim();
    const validationError = validateUploadFile(
      file instanceof File ? file : null,
      SLIDE_RULE,
    );
    if (validationError) {
      setSlideFileError(validationError);
      return;
    }
    setStatus("Menyiapkan upload…");
    setUploading(true);
    setUploadProgress({ phase: "preparing", percent: 0 });
    try {
      await uploadSlide(file as File, title, slugify(title), setUploadProgress);
      formElement.reset();
      setSlideTitle("");
      setSlideFile(null);
      setSlideFileError("");
      await load();
      setStatus("Slide tersimpan.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Gagal mengupload slide.",
      );
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }
  const filteredPortfolio = items.filter(
    (item) =>
      (!portfolioCategory || item.kategori === portfolioCategory) &&
      (!portfolioQuery ||
        `${item.judul} ${item.slug} ${item.kategori}`
          .toLowerCase()
          .includes(portfolioQuery.toLowerCase())),
  );
  const filteredSlides = slides.filter(
    (item) =>
      (!slideMime || item.mime_type === slideMime) &&
      (!slideQuery ||
        `${item.judul} ${item.slug}`
          .toLowerCase()
          .includes(slideQuery.toLowerCase())),
  );
  if (!session)
    return (
      <main className="page section">
        <p className="eyebrow">{t(language, "auth.ownerAccess")}</p>
        <h1>{t(language, "auth.studio")}</h1>
        <form className="form" onSubmit={login}>
          <input
            type="email"
            placeholder={t(language, "auth.email")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t(language, "auth.password")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <TurnstileWidget
            key={captchaKey}
            onToken={setCaptchaToken}
            onError={setStatus}
          />
          <button className="button primary" type="submit">
            Sign in ↗
          </button>
          {status && (
            <p className="status" role="alert">
              {status}
            </p>
          )}
          <small className="muted">Version {APP_VERSION}</small>
        </form>
      </main>
    );
  return (
    <main className="page section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Content studio</p>
          <h1>Owner dashboard.</h1>
        </div>
        <button
          className="button"
          onClick={() => void signOutOwner().then(() => setSession(false))}
        >
          Log out
        </button>
      </div>
      {status && (
        <p className="status" role="status">
          {status}
        </p>
      )}
      <section className="grid">
        <form className="card form" onSubmit={addProject}>
          <span className="tag">New portfolio</span>
          <input
            name="judul"
            placeholder="Judul project"
            value={projectTitle}
            onChange={(event) => setProjectTitle(event.target.value)}
            required
          />
          <input
            name="slug"
            placeholder="slug otomatis"
            value={slugify(projectTitle || projectUrl)}
            readOnly
            aria-label="Slug portfolio (otomatis)"
          />
          <select name="kategori" defaultValue="website">
            <option value="website">Website</option>
            <option value="aplikasi-web">Aplikasi web</option>
            <option value="company-profile">Company profile</option>
          </select>
          <textarea name="ringkasan" placeholder="Ringkasan" required />
          <input
            name="url_demo"
            type="url"
            placeholder="https://project-live.com"
            value={projectUrl}
            onChange={(event) => setProjectUrl(event.target.value)}
          />
          <input
            name="url_gambar"
            type="url"
            placeholder="URL cover manual (opsional)"
          />
          <input
            name="cover"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
            aria-describedby="cover-upload-help cover-upload-error"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              setProjectCover(next);
              setCoverError(validateUploadFile(next, PORTFOLIO_COVER_RULE));
            }}
          />
          <small id="cover-upload-help" className="muted">
            Screenshot otomatis diambil dari link demo. Cover upload opsional:
            JPG, PNG, WEBP, atau GIF · maksimal 5 MB.
          </small>
          {coverError && (
            <small
              id="cover-upload-error"
              className="admin-upload-error"
              role="alert"
            >
              {coverError}
            </small>
          )}
          {projectUrl && (
            <PortfolioPreview
              title={projectTitle || "Preview project"}
              demoUrl={projectUrl}
              compact
            />
          )}
          {projectCover && (
            <small className="muted">
              Cover dipilih: {projectCover.name} ·{" "}
              {formatFileSize(projectCover.size)}
            </small>
          )}
          <button className="button primary">Simpan portfolio ↗</button>
        </form>
        <article className="card admin-table-card">
          <div className="section-heading">
            <div>
              <span className="tag">
                Portfolio · {filteredPortfolio.length}/{items.length}
              </span>
              <h3>Portfolio list</h3>
            </div>
            <div className="admin-filters">
              <input
                aria-label="Cari portfolio"
                placeholder="Cari judul atau slug"
                value={portfolioQuery}
                onChange={(event) => setPortfolioQuery(event.target.value)}
              />
              <select
                aria-label="Filter kategori"
                value={portfolioCategory}
                onChange={(event) => setPortfolioCategory(event.target.value)}
              >
                <option value="">Semua kategori</option>
                <option value="website">Website</option>
                <option value="aplikasi-web">Aplikasi web</option>
                <option value="company-profile">Company profile</option>
              </select>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Kategori</th>
                  <th>Slug</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPortfolio.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.judul}</strong>
                      <br />
                      <small className="muted">{item.url_demo || "Tanpa demo"}</small>
                    </td>
                    <td>{item.kategori}</td>
                    <td>{item.slug}</td>
                    <td>
                      <button
                        className="tag"
                        type="button"
                        onClick={() => setPreviewPortfolio(item)}
                      >
                        Preview
                      </button>{" "}
                      <button
                        className="tag"
                        type="button"
                        onClick={() => void removeProject(item.id)}
                      >
                        Hide
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPortfolio.length === 0 && (
              <p className="muted">Tidak ada portfolio yang cocok.</p>
            )}
          </div>
        </article>
        <form className="card form" onSubmit={addTestimonial}>
          <span className="tag">New testimonial</span>
          <input name="nama" placeholder="Nama" required />
          <input name="jabatan" placeholder="Jabatan" />
          <textarea name="kutipan" placeholder="Kutipan" required />
          <button className="button primary">Simpan testimonial ↗</button>
        </form>
        <article className="card">
          <span className="tag">Testimonials · {testimonials.length}</span>
          {testimonials.map((item) => (
            <p key={item.id}>
              <strong>{item.nama}</strong>
              <br />
              <small className="muted">{item.kutipan}</small>
            </p>
          ))}
        </article>
        <form className="card form" onSubmit={addSlide}>
          <span className="tag">Upload slide</span>
          <input
            name="judul"
            placeholder="Judul slide"
            value={slideTitle}
            onChange={(event) => setSlideTitle(event.target.value)}
            required
          />
          <input
            name="slug"
            placeholder="slug otomatis"
            value={slugify(slideTitle)}
            readOnly
            aria-label="Slug slide (otomatis)"
          />
          <input
            name="file"
            type="file"
            accept=".html,.pdf,text/html,application/pdf"
            aria-describedby="slide-file-help slide-file-error"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              setSlideFile(next);
              setSlideFileError(validateUploadFile(next, SLIDE_RULE));
            }}
            required
          />
          <small id="slide-file-help" className="muted">
            HTML atau PDF · ekstensi .html/.pdf · maksimal 10 MB. Slug dibuat
            otomatis dari judul.
          </small>
          {slideFile && (
            <small className="muted">
              File dipilih: {slideFile.name} · {formatFileSize(slideFile.size)}
            </small>
          )}
          {slideFileError && (
            <small
              id="slide-file-error"
              className="admin-upload-error"
              role="alert"
            >
              {slideFileError}
            </small>
          )}
          {uploadProgress && (
            <div className="upload-progress" role="status">
              <progress max="100" value={uploadProgress.percent} />{" "}
              <span>
                {uploadProgress.phase === "preparing"
                  ? "Menyiapkan…"
                  : uploadProgress.phase === "saving"
                    ? "Menyimpan metadata…"
                    : `Mengupload… ${uploadProgress.percent}%`}
              </span>
            </div>
          )}
          <button className="button primary" type="submit" disabled={uploading}>
            {uploading ? "Upload berjalan…" : "Upload slide ↗"}
          </button>
        </form>
        <article className="card admin-table-card">
          <div className="section-heading">
            <div>
              <span className="tag">
                Slides · {filteredSlides.length}/{slides.length}
              </span>
              <h3>Slide list</h3>
            </div>
            <div className="admin-filters">
              <input
                aria-label="Cari slide"
                placeholder="Cari judul atau slug"
                value={slideQuery}
                onChange={(event) => setSlideQuery(event.target.value)}
              />
              <select
                aria-label="Filter tipe slide"
                value={slideMime}
                onChange={(event) => setSlideMime(event.target.value)}
              >
                <option value="">Semua tipe</option>
                <option value="text/html">HTML</option>
                <option value="application/pdf">PDF</option>
              </select>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Slide</th>
                  <th>Slug</th>
                  <th>Tipe</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlides.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.judul}</strong>
                      <br />
                      <small className="muted">{item.storage_path}</small>
                    </td>
                    <td>{item.slug}</td>
                    <td>{item.mime_type === "text/html" ? "HTML" : "PDF"}</td>
                    <td>
                      <button
                        className="tag"
                        type="button"
                        onClick={() => setPreviewSlide(item)}
                      >
                        Preview
                      </button>{" "}
                      <a
                        className="tag"
                        href={"/s/" + item.slug}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSlides.length === 0 && (
              <p className="muted">Tidak ada slide yang cocok.</p>
            )}
          </div>
        </article>
        <article className="card">
          <span className="tag">Inbox · {messages.length}</span>
          {messages.slice(0, 6).map((item) => (
            <p key={item.id}>
              <strong>{item.nama}</strong>
              <br />
              <small className="muted">
                {item.email} · {item.status}
              </small>
            </p>
          ))}
        </article>
      </section>
      {previewPortfolio && (
        <div
          className="preview-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewPortfolio(null);
          }}
        >
          <section
            className="preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-preview-title"
          >
            <div className="preview-modal-header">
              <div>
                <span className="tag">Portfolio preview</span>
                <h2 id="portfolio-preview-title">{previewPortfolio.judul}</h2>
              </div>
              <button
                className="preview-modal-close"
                type="button"
                aria-label="Tutup preview portfolio"
                onClick={() => setPreviewPortfolio(null)}
              >
                ×
              </button>
            </div>
            <PortfolioPreview
              title={previewPortfolio.judul}
              demoUrl={previewPortfolio.url_demo}
              coverUrl={previewPortfolio.url_gambar}
            />
          </section>
        </div>
      )}
      {previewSlide && (
        <div
          className="preview-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewSlide(null);
          }}
        >
          <section
            className="preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="slide-preview-title"
          >
            <div className="preview-modal-header">
              <div>
                <span className="tag">Slide preview</span>
                <h2 id="slide-preview-title">{previewSlide.judul}</h2>
              </div>
              <button
                className="preview-modal-close"
                type="button"
                aria-label="Tutup preview slide"
                onClick={() => setPreviewSlide(null)}
              >
                ×
              </button>
            </div>
            <SlidePreview
              title={previewSlide.judul}
              storagePath={previewSlide.storage_path}
              mimeType={previewSlide.mime_type}
            />
          </section>
        </div>
      )}
    </main>
  );
}

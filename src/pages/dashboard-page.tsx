/**
 * Module: Owner dashboard pages
 * Purpose: Provide a focused, route-based content management dashboard with material access controls for the owner
 * Used by: TanStack dashboard routes under /dashboard
 * Dependencies: React, TanStack Router, Supabase owner data service, shared upload validation, slide preview component
 * Public functions: DashboardApp()
 * Side effects: Reads authenticated owner data, writes profile/content changes, persists theme preference, and navigates to login when unauthenticated
 */
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { SlidePreview } from "../components/slide-preview";
import {
  createExperience,
  createMaterial,
  createPortfolio,
  createSkill,
  createTestimonial,
  deletePortfolio,
  deleteSlide,
  deleteSkill,
  deleteTestimonial,
  getOwnerSession,
  listContactMessages,
  listMaterials,
  listOwnerExperience,
  listOwnerPortfolio,
  listOwnerSkills,
  listSlides,
  listTestimonials,
  signOutOwner,
  slugify,
  updateContactStatus,
  updateExperience,
  updateMaterial,
  updateOwnerProfile,
  updatePortfolio,
  updateSlide,
  updateSlideOrder,
  updateTestimonial,
  updateSkill,
  uploadPortfolioCover,
  uploadSlide,
  type Experience,
  type Material,
  type Slide,
  type Skill,
  type Testimonial,
} from "../lib/admin";
import type { Portfolio } from "../lib/portfolio";
import { APP_VERSION } from "../lib/version";
import {
  formatFileSize,
  PORTFOLIO_COVER_RULE,
  SLIDE_RULE,
  validateUploadFile,
} from "../lib/file-validation";

type Message = {
  id: string;
  nama: string;
  email: string;
  status: string;
  dibuat_pada?: string;
};
type DashboardData = {
  portfolio: Portfolio[];
  slides: Slide[];
  materials: Material[];
  testimonials: Testimonial[];
  messages: Message[];
  experience: Experience[];
  skills: Skill[];
};

const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", path: "/dashboard", icon: "grid" },
      { label: "Portfolio", path: "/dashboard/portfolio", icon: "briefcase" },
      { label: "Slides", path: "/dashboard/slide", icon: "layers" },
      { label: "Experience", path: "/dashboard/experience", icon: "briefcase" },
      { label: "Skills", path: "/dashboard/skills", icon: "spark" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Testimonials", path: "/dashboard/testimonials", icon: "quote" },
      { label: "Messages", path: "/dashboard/messages", icon: "inbox" },
    ],
  },
];

function DashboardIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    plus: "M12 5v14M5 12h14",
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    briefcase: "M4 7h16v13H4zM8 7V4h8v3M4 12h16",
    layers: "m12 4 8 4-8 4-8-4 8-4Zm-8 8 8 4 8-4M4 16l8 4 8-4",
    quote:
      "M7 11H4a3 3 0 0 1 3-3h1v5a5 5 0 0 1-5 5M17 11h-3a3 3 0 0 1 3-3h1v5a5 5 0 0 1-5 5",
    inbox: "M4 5h16v14H4zM4 14h4l2 3h4l2-3h4",
    search: "m20 20-4.2-4.2M10.8 17a6.2 6.2 0 1 1 0-12.4 6.2 6.2 0 0 1 0 12.4Z",
    arrow: "M5 12h13m-5-5 5 5-5 5",
    logout: "M10 5H5v14h5m5-4 4-3-4-3m4 3H9",
    sun: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    moon: "M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z",
    chevron: "m15 6-6 6 6 6",
    spark: "m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Zm6 13 .7 2.3L21 19l-2.3.7L18 22l-.7-2.3L15 19l2.3-.7L18 16Z",
  };
  return (
    <svg
      className="dashboard-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.grid} />
    </svg>
  );
}

function DashboardNav({
  pathname,
  onLogout,
  collapsed,
  onToggle,
}: {
  pathname: string;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-head">
        <Link
          className="dashboard-brand"
          to="/dashboard"
          aria-label="raydiansyah.com dashboard"
          title="Dashboard"
        >
          <span className="dashboard-brand-mark">
            <img
              className="dashboard-brand-logo dashboard-brand-logo-dark"
              src="/brand-submark.png"
              alt=""
              aria-hidden="true"
            />
            <img
              className="dashboard-brand-logo dashboard-brand-logo-light"
              src="/brand-submark-light.svg"
              alt=""
              aria-hidden="true"
            />
          </span>
        </Link>
        <button
          className="dashboard-sidebar-toggle"
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
        >
          <DashboardIcon name="chevron" />
        </button>
      </div>
      <div className="dashboard-nav">
        {navGroups.map((group) => (
          <div className="dashboard-nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map((item) => (
              <Link
                key={item.path}
                className={`dashboard-nav-link${pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path)) ? " is-active" : ""}`}
                to={item.path}
                title={item.label}
              >
                <DashboardIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="dashboard-sidebar-footer">
        <Link className="dashboard-nav-link" to="/" title="View site">
          <DashboardIcon name="arrow" />
          <span>View site</span>
        </Link>
        <button
          className="dashboard-logout"
          type="button"
          title="Log out"
          onClick={onLogout}
        >
          <DashboardIcon name="logout" />
          <span>Log out</span>
        </button>
        <small>v{APP_VERSION}</small>
      </div>
    </aside>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: number;
  note: string;
  icon: string;
}) {
  return (
    <article className="dashboard-metric">
      <div className="dashboard-metric-top">
        <span>{label}</span>
        <span className="dashboard-icon-wrap">
          <DashboardIcon name={icon} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Overview({ data }: { data: DashboardData }) {
  const recentMessages = data.messages.slice(0, 5);
  return (
    <>
      <div className="dashboard-page-heading">
        <div>
          <p className="dashboard-kicker">Owner workspace</p>
          <h1>Good morning, Ray.</h1>
          <p>Kelola karya, presentasi, dan pesan masuk dari satu tempat.</p>
        </div>
        <Link className="dashboard-primary-action" to="/dashboard">
          Dashboard home <DashboardIcon name="arrow" />
        </Link>
      </div>
      <div className="dashboard-metrics">
        <MetricCard
          label="Published work"
          value={data.portfolio.length}
          note="Portfolio entries"
          icon="briefcase"
        />
        <MetricCard
          label="Presentation"
          value={data.slides.length}
          note="Published slides"
          icon="layers"
        />
        <MetricCard
          label="Testimonials"
          value={data.testimonials.length}
          note="Client voices"
          icon="quote"
        />
        <MetricCard
          label="Inbox"
          value={data.messages.length}
          note="Contact messages"
          icon="inbox"
        />
      </div>
      <div className="dashboard-overview-grid">
        <section className="dashboard-panel dashboard-activity-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="dashboard-kicker">Latest activity</p>
              <h2>Recent messages</h2>
            </div>
            <Link to="/dashboard/messages">
              View all <DashboardIcon name="arrow" />
            </Link>
          </div>
          {recentMessages.length ? (
            <div className="dashboard-message-list">
              {recentMessages.map((message) => (
                <div className="dashboard-message-row" key={message.id}>
                  <span className="dashboard-avatar">
                    {message.nama.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <strong>{message.nama}</strong>
                    <small>{message.email}</small>
                  </div>
                  <span className={`dashboard-status status-${message.status}`}>
                    {message.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              <strong>No messages yet.</strong>
              <span>Pesan baru dari form kontak akan muncul di sini.</span>
            </div>
          )}
        </section>
        <section className="dashboard-panel dashboard-quick-panel">
          <p className="dashboard-kicker">Quick actions</p>
          <h2>Keep the studio moving.</h2>
          <div className="dashboard-quick-list">
            <Link to="/dashboard/portfolio">
              <DashboardIcon name="briefcase" />
              <span>
                <strong>Review portfolio</strong>
                <small>Update your published work</small>
              </span>
              <DashboardIcon name="arrow" />
            </Link>
            <Link to="/dashboard/slide">
              <DashboardIcon name="layers" />
              <span>
                <strong>Manage slides</strong>
                <small>Open your presentation library</small>
              </span>
              <DashboardIcon name="arrow" />
            </Link>
            <Link to="/dashboard/messages">
              <DashboardIcon name="inbox" />
              <span>
                <strong>Read inbox</strong>
                <small>Follow up with new inquiries</small>
              </span>
              <DashboardIcon name="arrow" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function DashboardModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  return (
    <div
      className="dashboard-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="dashboard-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-modal-title"
      >
        <div className="dashboard-modal-heading">
          <div>
            <p className="dashboard-kicker">Content editor</p>
            <h2 id="dashboard-modal-title">{title}</h2>
          </div>
          <button
            className="dashboard-modal-close"
            type="button"
            aria-label="Close editor"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function PortfolioView({
  data,
  onChanged,
}: {
  data: Portfolio[];
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Portfolio | null>(null);
  const [creating, setCreating] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState("");
  const [saving, setSaving] = useState(false);
  function closeCreate() {
    setCreating(false);
    setCoverFile(null);
    setCoverError("");
  }
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!category || item.kategori === category) &&
          (!query ||
            `${item.judul} ${item.slug}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [category, data, query],
  );
  const allSelected =
    filtered.length > 0 && filtered.every((item) => selected.includes(item.id));
  function toggleSelected(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }
  function toggleAll() {
    setSelected(allSelected ? [] : filtered.map((item) => item.id));
  }
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    const validationError = validateUploadFile(coverFile, PORTFOLIO_COVER_RULE);
    if (coverFile && validationError) {
      setCoverError(validationError);
      return;
    }
    setSaving(true);
    try {
      const nextTitle = String(form.get("judul") ?? "").trim();
      const slug = slugify(nextTitle);
      const uploadedCover = coverFile
        ? await uploadPortfolioCover(coverFile, slug)
        : null;
      await createPortfolio({
        judul: nextTitle,
        slug,
        kategori: String(form.get("kategori")) as Portfolio["kategori"],
        ringkasan: String(form.get("ringkasan") ?? ""),
        url_demo: String(form.get("url_demo") ?? "").trim() || null,
        url_gambar:
          uploadedCover || String(form.get("url_gambar") ?? "").trim() || null,
      });
      target.reset();
      setCoverFile(null);
      setCoverError("");
      setCreating(false);
      setStatus("Portfolio added.");
      onChanged();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to add portfolio.",
      );
    } finally {
      setSaving(false);
    }
  }
  function edit(item: Portfolio) {
    setEditing(item);
  }
  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    try {
      await updatePortfolio(editing.id, {
        judul: String(form.get("judul") ?? "").trim(),
        slug: slugify(String(form.get("judul") ?? "")),
        kategori: String(
          form.get("kategori") ?? "website",
        ) as Portfolio["kategori"],
        ringkasan: String(form.get("ringkasan") ?? "").trim(),
        url_demo: String(form.get("url_demo") ?? "").trim() || null,
        url_gambar: String(form.get("url_gambar") ?? "").trim() || null,
      });
      setEditing(null);
      setStatus("Portfolio updated.");
      onChanged();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to update portfolio.",
      );
    }
  }
  async function hide(ids: string[]) {
    if (!ids.length || !window.confirm(`Hide ${ids.length} portfolio item(s)?`))
      return;
    try {
      await Promise.all(ids.map((id) => deletePortfolio(id)));
      setSelected([]);
      setStatus(`${ids.length} portfolio item(s) hidden.`);
      onChanged();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to hide portfolio.",
      );
    }
  }
  return (
    <DashboardCollection
      title="Portfolio"
      kicker="Published work"
      description="Kelola karya langsung dari dashboard."
      actionLabel="Add portfolio"
      actionPath="/dashboard/portfolio"
    >
      {status && (
        <p className="dashboard-form-status" role="status">
          {status}
        </p>
      )}
      <div className="dashboard-toolbar">
        <label className="dashboard-search">
          <DashboardIcon name="search" />
          <span className="sr-only">Search portfolio</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search portfolio"
          />
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter portfolio category"
        >
          <option value="">All categories</option>
          <option value="website">Website</option>
          <option value="aplikasi-web">Aplikasi web</option>
          <option value="company-profile">Company profile</option>
        </select>
        <button
          className="dashboard-bulk-action"
          type="button"
          disabled={!selected.length}
          onClick={() => void hide(selected)}
        >
          Bulk hide ({selected.length})
        </button>
        <button
          className="dashboard-primary-action dashboard-toolbar-create"
          type="button"
          onClick={() => setCreating(true)}
        >
          <DashboardIcon name="plus" /> New portfolio
        </button>
      </div>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all filtered portfolio"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              <th>Project</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.judul}`}
                    checked={selected.includes(item.id)}
                    onChange={() => toggleSelected(item.id)}
                  />
                </td>
                <td>
                  <strong>{item.judul}</strong>
                  <small>{item.slug}</small>
                </td>
                <td>{item.kategori}</td>
                <td>
                  <span className="dashboard-status status-live">
                    Published
                  </span>
                </td>
                <td>
                  <div className="dashboard-row-actions">
                    {item.url_demo && (
                      <a
                        className="dashboard-table-link"
                        href={item.url_demo}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    )}
                    <button
                      className="dashboard-table-action"
                      type="button"
                      onClick={() => void edit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="dashboard-table-action"
                      type="button"
                      onClick={() => void hide([item.id])}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <DashboardEmpty
            title="No portfolio found"
            text="Coba ubah kata kunci atau filter kategori."
          />
        )}
      </div>
      {editing && (
        <DashboardModal title="Edit portfolio" onClose={() => setEditing(null)}>
          <form className="dashboard-modal-form" onSubmit={saveEdit}>
            <label>
              Project title
              <input name="judul" defaultValue={editing.judul} required />
            </label>
            <label>
              Category
              <select name="kategori" defaultValue={editing.kategori}>
                <option value="website">Website</option>
                <option value="aplikasi-web">Web app</option>
                <option value="company-profile">Company profile</option>
              </select>
            </label>
            <label>
              Summary
              <textarea
                name="ringkasan"
                defaultValue={editing.ringkasan}
                required
              />
            </label>
            <label>
              Live URL
              <input
                name="url_demo"
                type="url"
                defaultValue={editing.url_demo ?? ""}
              />
            </label>
            <label>
              Cover URL
              <input
                name="url_gambar"
                type="url"
                defaultValue={editing.url_gambar ?? ""}
              />
            </label>
            <div className="dashboard-modal-actions">
              <button
                className="dashboard-table-action"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="dashboard-primary-action" type="submit">
                Save changes <DashboardIcon name="arrow" />
              </button>
            </div>
          </form>
        </DashboardModal>
      )}
      {creating && (
        <DashboardModal title="New portfolio" onClose={closeCreate}>
          <form className="dashboard-modal-form" onSubmit={add}>
            <label>
              Project title
              <input name="judul" placeholder="Project title" required />
            </label>
            <label>
              Category
              <select name="kategori" defaultValue="website">
                <option value="website">Website</option>
                <option value="aplikasi-web">Web app</option>
                <option value="company-profile">Company profile</option>
              </select>
            </label>
            <label>
              Summary
              <textarea
                name="ringkasan"
                placeholder="Short project summary"
                required
              />
            </label>
            <label>
              Live URL
              <input
                name="url_demo"
                type="url"
                placeholder="https://project.com"
              />
            </label>
            <label>
              Cover URL{" "}
              <span className="dashboard-field-note">
                Optional fallback URL
              </span>
              <input
                name="url_gambar"
                type="url"
                placeholder="https://cdn.example.com/cover.jpg"
              />
            </label>
            <label>
              Cover upload
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                aria-describedby="portfolio-cover-help portfolio-cover-error"
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null;
                  setCoverFile(next);
                  setCoverError(
                    next ? validateUploadFile(next, PORTFOLIO_COVER_RULE) : "",
                  );
                }}
              />
              <small
                id="portfolio-cover-help"
                className="dashboard-upload-help"
              >
                JPG, PNG, WEBP, atau GIF · maksimal 5 MB · akan diupload ke R2
              </small>
              {coverFile && (
                <small className="dashboard-upload-file">
                  {coverFile.name} · {formatFileSize(coverFile.size)}
                </small>
              )}
              {coverError && (
                <small
                  id="portfolio-cover-error"
                  className="dashboard-form-error"
                  role="alert"
                >
                  {coverError}
                </small>
              )}
            </label>
            <div className="dashboard-modal-actions">
              <button
                className="dashboard-table-action"
                type="button"
                onClick={closeCreate}
              >
                Cancel
              </button>
              <button
                className="dashboard-primary-action"
                type="submit"
                disabled={saving}
              >
                {saving ? "Uploading…" : "Save portfolio"}{" "}
                <DashboardIcon name="arrow" />
              </button>
            </div>
          </form>
        </DashboardModal>
      )}
    </DashboardCollection>
  );
}

function SlideView({
  data,
  materials,
  onChanged,
}: {
  data: Slide[];
  materials: Material[];
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [mime, setMime] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Slide | null>(null);
  const [materialId, setMaterialId] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [createSlideModal, setCreateSlideModal] = useState(false);
  const [shareMaterial, setShareMaterial] = useState<Material | null>(null);
  const [materialAccessMode, setMaterialAccessMode] = useState("none");
  const [materialAccessCode, setMaterialAccessCode] = useState("");
  const [materialExpiry, setMaterialExpiry] = useState("");
  const [createSlideMaterialId, setCreateSlideMaterialId] = useState("");
  const [createNewMaterial, setCreateNewMaterial] = useState(false);
  const [slideSaving, setSlideSaving] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    materials[0] ?? null,
  );
  const activeMaterialId = materialId || selectedMaterial?.id || "";
  const shareMaterialSlides = data.filter((item) => item.material_id === shareMaterial?.id && item.status_tampil).sort((a, b) => a.urutan - b.urutan);
  const materialShareUrl = shareMaterialSlides[0] && typeof window !== "undefined"
    ? `${window.location.origin}/s/${shareMaterialSlides[0].slug}`
    : "";
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!activeMaterialId || item.material_id === activeMaterialId) &&
          (!mime || item.mime_type === mime) &&
          (!query ||
            `${item.judul} ${item.slug}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [activeMaterialId, data, mime, query],
  );
  const allSelected =
    filtered.length > 0 && filtered.every((item) => selected.includes(item.id));
  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }
  function toggleAll() {
    setSelected(allSelected ? [] : filtered.map((item) => item.id));
  }
  function openMaterialShare() {
    const material = materials.find((item) => item.id === activeMaterialId) ?? null;
    if (!material) return;
    setShareMaterial(material);
    setMaterialAccessMode(material.akses_kode ? "custom" : "none");
    setMaterialAccessCode(material.akses_kode ?? "");
    setMaterialExpiry(material.akses_berakhir_pada ? new Date(material.akses_berakhir_pada).toISOString().slice(0, 16) : "");
  }
  function selectMaterialForShare(id: string) {
    const material = materials.find((item) => item.id === id) ?? null;
    if (!material) return;
    setShareMaterial(material);
    setMaterialAccessMode(material.akses_kode ? "custom" : "none");
    setMaterialAccessCode(material.akses_kode ?? "");
    setMaterialExpiry(material.akses_berakhir_pada ? new Date(material.akses_berakhir_pada).toISOString().slice(0, 16) : "");
  }
  async function copyMaterialShare() {
    if (!materialShareUrl) return;
    await navigator.clipboard.writeText(materialShareUrl);
    setStatus("Material link copied.");
  }
  async function copyMaterialCode() {
    if (!shareMaterial?.akses_kode) return;
    await navigator.clipboard.writeText(shareMaterial.akses_kode);
    setStatus("Access code copied.");
  }
  async function saveMaterialAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shareMaterial) return;
    const nextCode = materialAccessMode === "auto"
      ? `RD-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`
      : materialAccessMode === "custom" ? materialAccessCode.trim() : "";
    if (materialAccessMode === "custom" && nextCode.length < 4) {
      setStatus("Custom access code must be at least 4 characters.");
      return;
    }
    try {
      await updateMaterial(shareMaterial.id, {
        akses_kode: nextCode || null,
        akses_berakhir_pada: materialExpiry ? new Date(materialExpiry).toISOString() : null,
      });
      setShareMaterial((current) => current ? { ...current, akses_kode: nextCode || null, akses_berakhir_pada: materialExpiry ? new Date(materialExpiry).toISOString() : null } : current);
      setMaterialAccessCode(nextCode);
      setStatus("Material access settings saved.");
      onChanged();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save material access.");
    }
  }
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateUploadFile(file, SLIDE_RULE);
    if (validationError) {
      setFileError(validationError);
      return;
    }
    try {
      const form = new FormData(event.currentTarget);
      const selectedMaterialId = String(form.get("material_id") ?? "");
      let destinationMaterialId = selectedMaterialId;
      let createdAccessCode = "";
      if (selectedMaterialId === "__new__") {
        const accessCodeMode = String(form.get("access_code_mode") ?? "none");
        const generatedCode = accessCodeMode === "auto"
          ? `RD-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`
          : String(form.get("access_code") ?? "").trim();
        if (accessCodeMode === "custom" && generatedCode.length < 4) {
          setStatus("Custom access code must be at least 4 characters.");
          return;
        }
        const created = await createMaterial({
          judul: String(form.get("new_material_judul") ?? "").trim(),
          slug: slugify(String(form.get("new_material_judul") ?? "")),
          deskripsi: String(form.get("new_material_deskripsi") ?? "").trim(),
          akses_kode: generatedCode || null,
          akses_berakhir_pada: String(form.get("access_expires_at") ?? "").trim() || null,
        });
        destinationMaterialId = created.id;
        createdAccessCode = created.akses_kode ?? "";
      }
      if (!destinationMaterialId) {
        setStatus("Buat atau pilih material terlebih dahulu.");
        return;
      }
      setSlideSaving(true);
      const materialSlides = data.filter(
        (item) => item.material_id === destinationMaterialId,
      );
      await uploadSlide(file as File, title, slugify(title), {
        materialId: destinationMaterialId,
        urutan: materialSlides.length,
      });
      setTitle("");
      setFile(null);
      setFileError("");
      setStatus(createdAccessCode ? `Slide added. Access code: ${createdAccessCode}` : "Slide added.");
      setCreateSlideModal(false);
      setCreateNewMaterial(false);
      event.currentTarget.reset();
      onChanged();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to add slide.",
      );
    } finally {
      setSlideSaving(false);
    }
  }
  function edit(item: Slide) {
    setEditing(item);
  }
  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const next = String(form.get("judul") ?? "").trim();
    if (!next) return;
    try {
      await updateSlide(editing.id, { judul: next, slug: slugify(next) });
      setEditing(null);
      setStatus("Slide updated.");
      onChanged();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to update slide.",
      );
    }
  }
  async function hide(ids: string[]) {
    if (!ids.length || !window.confirm(`Hide ${ids.length} slide(s)?`)) return;
    try {
      await Promise.all(ids.map(deleteSlide));
      setSelected([]);
      setStatus("Slide(s) hidden.");
      onChanged();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to hide slide.",
      );
    }
  }
  async function reorder(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const next = data
      .filter((item) => item.material_id === activeMaterialId)
      .sort((a, b) => a.urutan - b.urutan);
    const from = next.findIndex((item) => item.id === draggedId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    try {
      await updateSlideOrder(
        next.map((item, index) => ({ ...item, urutan: index })),
      );
      setStatus("Urutan slide tersimpan.");
      onChanged();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan urutan slide.",
      );
    } finally {
      setDraggedId(null);
    }
  }
  return (
    <DashboardCollection
      title="Slides"
      kicker="Presentation library"
      description="Kelola deck HTML dan PDF langsung dari dashboard."
      actionLabel="Add slide"
      actionPath="/dashboard/slide"
    >
      {false && (
        <form
          className="dashboard-add-form dashboard-add-form-single dashboard-inline-create-form"
          onSubmit={add}
        >
          <label>
            Material
            <select
              value={activeMaterialId}
              onChange={(event) => {
                setMaterialId(event.target.value);
                setSelectedMaterial(
                  materials.find((item) => item.id === event.target.value) ??
                    null,
                );
              }}
              required
            >
              <option value="">Pilih material</option>
              {materials.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.judul}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Presentation title"
              required
            />
          </label>
          <label>
            File
            <input
              type="file"
              accept=".html,.pdf,text/html,application/pdf"
              aria-describedby="slide-upload-help slide-upload-error"
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                setFile(next);
                setFileError(validateUploadFile(next, SLIDE_RULE));
              }}
              required
            />
            <small id="slide-upload-help" className="dashboard-upload-help">
              HTML atau PDF · ekstensi .html/.pdf · maksimal 10 MB
            </small>
            {file && (
              <small className="dashboard-upload-file">
                {file?.name} · {formatFileSize(file?.size ?? 0)}
              </small>
            )}
            {fileError && (
              <small
                id="slide-upload-error"
                className="dashboard-form-error"
                role="alert"
              >
                {fileError}
              </small>
            )}
          </label>
          <button className="dashboard-primary-action" type="submit">
            Add slide <DashboardIcon name="arrow" />
          </button>
        </form>
      )}
      {status && (
        <p className="dashboard-form-status" role="status">
          {status}
        </p>
      )}
      <div className="dashboard-toolbar">
        <select
          value={activeMaterialId}
          onChange={(event) => {
            setMaterialId(event.target.value);
            setSelectedMaterial(
              materials.find((item) => item.id === event.target.value) ?? null,
            );
          }}
          aria-label="Filter material"
        >
          <option value="">All materials</option>
          {materials.map((item) => (
            <option value={item.id} key={item.id}>
              {item.judul}
            </option>
          ))}
        </select>
        <label className="dashboard-search">
          <DashboardIcon name="search" />
          <span className="sr-only">Search slides</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search slides"
          />
        </label>
        <select
          value={mime}
          onChange={(event) => setMime(event.target.value)}
          aria-label="Filter slide type"
        >
          <option value="">All types</option>
          <option value="text/html">HTML</option>
          <option value="application/pdf">PDF</option>
        </select>
        <button
          className="dashboard-primary-action dashboard-toolbar-create"
          type="button"
          onClick={() => {
            setCreateSlideMaterialId(activeMaterialId);
            setCreateSlideModal(true);
          }}
        >
          <DashboardIcon name="plus" /> New slide
        </button>
        <button
          className="dashboard-table-action"
          type="button"
          disabled={!materials.length}
          onClick={openMaterialShare}
        >
          Share material
        </button>
        <button
          className="dashboard-bulk-action"
          type="button"
          disabled={!selected.length}
          onClick={() => void hide(selected)}
        >
          Bulk hide ({selected.length})
        </button>
      </div>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all filtered slides"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              <th>Preview</th>
              <th>Title</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => (
              <tr
                key={item.id}
                draggable
                onDragStart={() => setDraggedId(item.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => void reorder(item.id)}
              >
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.judul}`}
                    checked={selected.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                </td>
                <td>
                  <SlidePreview
                    title={item.judul}
                    storagePath={item.storage_path}
                    mimeType={item.mime_type}
                  />
                </td>
                <td>
                  <strong>{item.judul}</strong>
                  <small>{item.slug}</small>
                </td>
                <td>{item.mime_type === "text/html" ? "HTML" : "PDF"}</td>
                <td>
                  <div className="dashboard-row-actions">
                    <a
                      className="dashboard-table-link"
                      href={`/s/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                    <button
                      className="dashboard-table-action"
                      type="button"
                      onClick={() => void edit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="dashboard-table-action"
                      type="button"
                      onClick={() => void hide([item.id])}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <DashboardEmpty
            title="No slides found"
            text="Upload a slide from the dashboard first."
          />
        )}
      </div>
      {createSlideModal && (
        <DashboardModal
          title="New slide"
          onClose={() => setCreateSlideModal(false)}
        >
          <form className="dashboard-modal-form" onSubmit={add}>
            <label>
              Material
              <select
                name="material_id"
                value={createNewMaterial ? "__new__" : createSlideMaterialId}
                onChange={(event) => {
                  const value = event.target.value;
                  setCreateNewMaterial(value === "__new__");
                  setCreateSlideMaterialId(value === "__new__" ? "" : value);
                }}
                required
              >
                <option value="">Pilih material</option>
                {materials.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.judul}
                  </option>
                ))}
                <option value="__new__">+ Create new material</option>
              </select>
            </label>
            {createNewMaterial && (
              <div className="dashboard-modal-nested-fields">
                <label>
                  New material title
                  <input
                    name="new_material_judul"
                    placeholder="Programming basics"
                    required={createNewMaterial}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    name="new_material_deskripsi"
                    placeholder="Course material description"
                  />
                </label>
                <label>
                  Access code
                  <select name="access_code_mode" defaultValue="none">
                    <option value="none">No access code</option>
                    <option value="auto">Generate automatically</option>
                    <option value="custom">Use custom code</option>
                  </select>
                </label>
                <label>
                  Custom code
                  <input name="access_code" minLength={4} maxLength={64} placeholder="Optional when custom" />
                </label>
                <label>
                  Expiry (optional)
                  <input name="access_expires_at" type="datetime-local" />
                </label>
              </div>
            )}
            <label>
              Title
              <input
                name="judul"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Presentation title"
                required
              />
            </label>
            <label>
              File
              <input
                name="file"
                type="file"
                accept=".html,.pdf,text/html,application/pdf"
                aria-describedby="slide-modal-upload-help slide-modal-upload-error"
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null;
                  setFile(next);
                  setFileError(validateUploadFile(next, SLIDE_RULE));
                }}
                required
              />
              <small
                id="slide-modal-upload-help"
                className="dashboard-upload-help"
              >
                HTML atau PDF · ekstensi .html/.pdf · maksimal 10 MB
              </small>
              {file && (
                <small className="dashboard-upload-file">
                  {file.name} · {formatFileSize(file.size)}
                </small>
              )}
              {fileError && (
                <small
                  id="slide-modal-upload-error"
                  className="dashboard-form-error"
                  role="alert"
                >
                  {fileError}
                </small>
              )}
            </label>
            <div className="dashboard-modal-actions">
              <button
                className="dashboard-table-action"
                type="button"
                onClick={() => setCreateSlideModal(false)}
              >
                Cancel
              </button>
              <button
                className="dashboard-primary-action"
                type="submit"
                disabled={slideSaving}
              >
                {slideSaving ? "Uploading…" : "Save slide"}{" "}
                <DashboardIcon name="arrow" />
              </button>
            </div>
          </form>
        </DashboardModal>
      )}
      {editing && (
        <DashboardModal title="Edit slide" onClose={() => setEditing(null)}>
          <form className="dashboard-modal-form" onSubmit={saveEdit}>
            <label>
              Title
              <input name="judul" defaultValue={editing.judul} required />
            </label>
            <label>
              Slug
              <input
                value={editing.slug}
                readOnly
                aria-label="Generated slide slug"
              />
            </label>
            <p className="dashboard-modal-note">
              File type: {editing.mime_type === "text/html" ? "HTML" : "PDF"}.
              The uploaded file is preserved.
            </p>
            <div className="dashboard-modal-actions">
              <button
                className="dashboard-table-action"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="dashboard-primary-action" type="submit">
                Save changes <DashboardIcon name="arrow" />
              </button>
            </div>
          </form>
        </DashboardModal>
      )}
      {shareMaterial && (
        <DashboardModal title="Share material" onClose={() => setShareMaterial(null)}>
          <form className="dashboard-modal-form" onSubmit={saveMaterialAccess}>
            <label>
              Material
              <select value={shareMaterial.id} onChange={(event) => selectMaterialForShare(event.target.value)}>
                {materials.map((item) => <option value={item.id} key={item.id}>{item.judul}</option>)}
              </select>
            </label>
            <label>
              Share URL
              <div className="dashboard-copy-field"><input value={materialShareUrl || "Upload a slide to create a link"} readOnly /><button className="dashboard-table-action" type="button" disabled={!materialShareUrl} onClick={() => void copyMaterialShare()}>Copy</button></div>
            </label>
            <label>
              Access code
              <select value={materialAccessMode} onChange={(event) => setMaterialAccessMode(event.target.value)}>
                <option value="none">No access code</option>
                <option value="auto">Generate automatically</option>
                <option value="custom">Use custom code</option>
              </select>
            </label>
            {materialAccessMode === "custom" && <label>Custom code<input value={materialAccessCode} onChange={(event) => setMaterialAccessCode(event.target.value)} minLength={4} maxLength={64} required /></label>}
            {shareMaterial.akses_kode && <label>Current code<div className="dashboard-copy-field"><input value={shareMaterial.akses_kode} readOnly /><button className="dashboard-table-action" type="button" onClick={() => void copyMaterialCode()}>Copy</button></div></label>}
            <label>Expiry (optional)<input type="datetime-local" value={materialExpiry} onChange={(event) => setMaterialExpiry(event.target.value)} /></label>
            <p className="dashboard-modal-note">Without an expiry, the material link remains available until the access code is changed or removed.</p>
            <div className="dashboard-modal-actions"><button className="dashboard-table-action" type="button" onClick={() => setShareMaterial(null)}>Cancel</button><button className="dashboard-primary-action" type="submit">Save access settings <DashboardIcon name="arrow" /></button></div>
          </form>
        </DashboardModal>
      )}
    </DashboardCollection>
  );
}

function TestimonialsView({
  data,
  onChanged,
}: {
  data: Testimonial[];
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const filtered = data.filter(
    (item) =>
      (!visibility || String(item.status_tampil) === visibility) &&
      (!query ||
        `${item.nama} ${item.jabatan ?? ""} ${item.kutipan}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  const allSelected =
    filtered.length > 0 && filtered.every((item) => selected.includes(item.id));
  function toggleAll() {
    setSelected(allSelected ? [] : filtered.map((item) => item.id));
  }
  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    try {
      await createTestimonial({
        nama: String(form.get("nama") ?? ""),
        jabatan: String(form.get("jabatan") ?? ""),
        kutipan: String(form.get("kutipan") ?? ""),
      });
      target.reset();
      setStatus("Testimonial added.");
      onChanged();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to add testimonial.",
      );
    }
  }
  function edit(item: Testimonial) {
    setEditing(item);
  }
  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    try {
      await updateTestimonial(editing.id, {
        nama: String(form.get("nama") ?? "").trim(),
        jabatan: String(form.get("jabatan") ?? "").trim(),
        kutipan: String(form.get("kutipan") ?? "").trim(),
        status_tampil: form.get("status_tampil") === "on",
      });
      setEditing(null);
      setStatus("Testimonial updated.");
      onChanged();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Failed to update testimonial.",
      );
    }
  }
  async function hide(ids: string[]) {
    if (!ids.length || !window.confirm(`Hide ${ids.length} testimonial(s)?`))
      return;
    try {
      await Promise.all(ids.map(deleteTestimonial));
      setSelected([]);
      setStatus("Testimonial(s) hidden.");
      onChanged();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to hide testimonial.",
      );
    }
  }
  return (
    <DashboardCollection
      title="Testimonials"
      kicker="Client voices"
      description="Kelola social proof langsung dari dashboard."
      actionLabel="Add testimonial"
      actionPath="/dashboard/testimonials"
    >
      <form
        className="dashboard-add-form dashboard-add-form-single"
        onSubmit={add}
      >
        <label>
          Name
          <input name="nama" placeholder="Client name" required />
        </label>
        <label>
          Role
          <input name="jabatan" placeholder="Founder, CEO, etc." />
        </label>
        <label>
          Quote
          <input name="kutipan" placeholder="Client quote" required />
        </label>
        <button className="dashboard-primary-action" type="submit">
          Add testimonial <DashboardIcon name="arrow" />
        </button>
      </form>
      {status && (
        <p className="dashboard-form-status" role="status">
          {status}
        </p>
      )}
      <div className="dashboard-toolbar">
        <label className="dashboard-search">
          <DashboardIcon name="search" />
          <span className="sr-only">Search testimonials</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search testimonials"
          />
        </label>
        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
          aria-label="Filter testimonial visibility"
        >
          <option value="">All visibility</option>
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>
        <button
          className="dashboard-bulk-action"
          type="button"
          disabled={!selected.length}
          onClick={() => void hide(selected)}
        >
          Bulk hide ({selected.length})
        </button>
      </div>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all filtered testimonials"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              <th>Client</th>
              <th>Quote</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.nama}`}
                    checked={selected.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                </td>
                <td>
                  <strong>{item.nama}</strong>
                  <small>{item.jabatan || "Client"}</small>
                </td>
                <td>{item.kutipan}</td>
                <td>
                  <span
                    className={`dashboard-status ${item.status_tampil ? "status-live" : "status-arsip"}`}
                  >
                    {item.status_tampil ? "Visible" : "Hidden"}
                  </span>
                </td>
                <td>
                  <div className="dashboard-row-actions">
                    <button
                      className="dashboard-table-action"
                      type="button"
                      onClick={() => void edit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="dashboard-table-action"
                      type="button"
                      onClick={() => void hide([item.id])}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <DashboardEmpty
            title="No testimonials found"
            text="Coba ubah kata kunci atau filter visibility."
          />
        )}
      </div>
      {editing && (
        <DashboardModal
          title="Edit testimonial"
          onClose={() => setEditing(null)}
        >
          <form className="dashboard-modal-form" onSubmit={saveEdit}>
            <label>
              Name
              <input name="nama" defaultValue={editing.nama} required />
            </label>
            <label>
              Role
              <input name="jabatan" defaultValue={editing.jabatan ?? ""} />
            </label>
            <label>
              Quote
              <textarea
                name="kutipan"
                defaultValue={editing.kutipan}
                required
              />
            </label>
            <label className="dashboard-checkbox-field">
              <input
                name="status_tampil"
                type="checkbox"
                defaultChecked={editing.status_tampil}
              />{" "}
              Show on website
            </label>
            <div className="dashboard-modal-actions">
              <button
                className="dashboard-table-action"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="dashboard-primary-action" type="submit">
                Save changes <DashboardIcon name="arrow" />
              </button>
            </div>
          </form>
        </DashboardModal>
      )}
    </DashboardCollection>
  );
}

function ExperienceView({
  data,
  onCreated,
}: {
  data: Experience[];
  onCreated: () => void;
}) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Experience | null>(null);
  const filtered = data.filter(
    (item) =>
      (!visibility || String(item.status_tampil) === visibility) &&
      (!query ||
        `${item.periode} ${item.judul} ${item.stack}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    try {
      await createExperience({
        periode: String(form.get("periode") ?? ""),
        judul: String(form.get("judul") ?? ""),
        ringkasan: String(form.get("ringkasan") ?? ""),
        stack: String(form.get("stack") ?? ""),
        urutan: Number(form.get("urutan") ?? 0),
      });
      target.reset();
      setStatus("Experience saved.");
      onCreated();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to save experience.",
      );
    }
  }
  function edit(item: Experience) {
    setEditing(item);
  }
  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    try {
      await updateExperience(editing.id, {
        periode: String(form.get("periode") ?? ""),
        judul: String(form.get("judul") ?? ""),
        ringkasan: String(form.get("ringkasan") ?? ""),
        stack: String(form.get("stack") ?? ""),
        urutan: Number(form.get("urutan") ?? 0),
        status_tampil: form.get("status_tampil") === "on",
      });
      setEditing(null);
      setStatus("Experience updated.");
      onCreated();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to update experience.",
      );
    }
  }
  async function toggleVisibility(item: Experience) {
    try {
      await updateExperience(item.id, { status_tampil: !item.status_tampil });
      setStatus(
        item.status_tampil ? "Experience hidden." : "Experience visible.",
      );
      onCreated();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to hide experience.",
      );
    }
  }
  return (
    <DashboardCollection
      title="Experience"
      kicker="Career chapters"
      description="Kelola pengalaman yang tampil di homepage dan halaman about."
      actionLabel="View public about"
      actionPath="/about"
    >
      <div className="dashboard-experience-layout">
        <form className="dashboard-inline-form" onSubmit={submit}>
          <label>
            Period
            <input name="periode" placeholder="2024—NOW" required />
          </label>
          <label>
            Title
            <input
              name="judul"
              placeholder="Independent digital studio"
              required
            />
          </label>
          <label>
            Summary
            <textarea
              name="ringkasan"
              placeholder="What did you work on?"
              required
            />
          </label>
          <label>
            Stack
            <input name="stack" placeholder="React · Supabase" required />
          </label>
          <label>
            Order
            <input
              name="urutan"
              type="number"
              min="0"
              defaultValue="0"
              required
            />
          </label>
          <button className="dashboard-primary-action" type="submit">
            Add experience <DashboardIcon name="arrow" />
          </button>
          {status && (
            <small className="dashboard-form-status" role="status">
              {status}
            </small>
          )}
        </form>
        <div>
          <div className="dashboard-toolbar">
            <label className="dashboard-search">
              <DashboardIcon name="search" />
              <span className="sr-only">Search experience</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search experience"
              />
            </label>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
              aria-label="Filter experience visibility"
            >
              <option value="">All visibility</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Experience</th>
                  <th>Stack</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{item.periode}</td>
                    <td>
                      <strong>{item.judul}</strong>
                      <small>{item.ringkasan}</small>
                    </td>
                    <td>{item.stack}</td>
                    <td>
                      <span
                        className={`dashboard-status ${item.status_tampil ? "status-live" : "status-arsip"}`}
                      >
                        {item.status_tampil ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="dashboard-row-actions">
                        <button
                          className="dashboard-table-action"
                          type="button"
                          onClick={() => edit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className={`dashboard-visibility-toggle${item.status_tampil ? " is-on" : ""}`}
                          type="button"
                          aria-pressed={item.status_tampil}
                          onClick={() => void toggleVisibility(item)}
                        >
                          <i aria-hidden="true" />{" "}
                          {item.status_tampil ? "Visible" : "Hidden"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <DashboardEmpty
                title="No experience found"
                text="Tambahkan experience pertama atau ubah filter."
              />
            )}
          </div>
        </div>
      </div>
      {editing && (
        <DashboardModal
          title="Edit experience"
          onClose={() => setEditing(null)}
        >
          <form className="dashboard-modal-form" onSubmit={saveEdit}>
            <label>
              Period
              <input name="periode" defaultValue={editing.periode} required />
            </label>
            <label>
              Title
              <input name="judul" defaultValue={editing.judul} required />
            </label>
            <label>
              Summary
              <textarea
                name="ringkasan"
                defaultValue={editing.ringkasan}
                required
              />
            </label>
            <label>
              Stack
              <input name="stack" defaultValue={editing.stack} required />
            </label>
            <label>
              Order
              <input
                name="urutan"
                type="number"
                min="0"
                defaultValue={editing.urutan}
                required
              />
            </label>
            <label className="dashboard-checkbox-field">
              <input
                name="status_tampil"
                type="checkbox"
                defaultChecked={editing.status_tampil}
              />{" "}
              Show on website
            </label>
            <div className="dashboard-modal-actions">
              <button
                className="dashboard-table-action"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="dashboard-primary-action" type="submit">
                Save changes <DashboardIcon name="arrow" />
              </button>
            </div>
          </form>
        </DashboardModal>
      )}
    </DashboardCollection>
  );
}

function SkillsView({
  data,
  onChanged,
}: {
  data: Skill[];
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Skill | null>(null);
  const [creating, setCreating] = useState(false);
  const categories = Array.from(new Set(data.map((item) => item.kategori))).sort();
  const filtered = data.filter(
    (item) =>
      (!category || item.kategori === category) &&
      (!visibility || String(item.status_tampil) === visibility) &&
      (!query || `${item.nama} ${item.kategori}`.toLowerCase().includes(query.toLowerCase())),
  );
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createSkill({
        nama: String(form.get("nama") ?? "").trim(),
        kategori: String(form.get("kategori") ?? "Engineering").trim(),
        urutan: Number(form.get("urutan") ?? 0),
      });
      setCreating(false);
      setStatus("Skill saved.");
      onChanged();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save skill.");
    }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    try {
      await updateSkill(editing.id, {
        nama: String(form.get("nama") ?? "").trim(),
        kategori: String(form.get("kategori") ?? "Engineering").trim(),
        urutan: Number(form.get("urutan") ?? 0),
        status_tampil: form.get("status_tampil") === "on",
      });
      setEditing(null);
      setStatus("Skill updated.");
      onChanged();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update skill.");
    }
  }
  async function toggle(item: Skill) {
    try {
      await updateSkill(item.id, { status_tampil: !item.status_tampil });
      setStatus(item.status_tampil ? "Skill hidden." : "Skill visible.");
      onChanged();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update skill.");
    }
  }
  async function archive(item: Skill) {
    if (!window.confirm(`Hide ${item.nama} from the website?`)) return;
    try {
      await deleteSkill(item.id);
      setStatus("Skill hidden.");
      onChanged();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to hide skill.");
    }
  }
  function SkillForm({ item, onSubmit }: { item?: Skill; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
    return <form className="dashboard-modal-form" onSubmit={onSubmit}>
      <label>Skill name<input name="nama" defaultValue={item?.nama} placeholder="TypeScript" required /></label>
      <label>Category<input name="kategori" defaultValue={item?.kategori ?? "Engineering"} placeholder="Engineering" required /></label>
      <label>Order<input name="urutan" type="number" min="0" defaultValue={item?.urutan ?? data.length + 1} required /></label>
      {item && <label className="dashboard-checkbox-field"><input name="status_tampil" type="checkbox" defaultChecked={item.status_tampil} /> Show on website</label>}
      <div className="dashboard-modal-actions"><button className="dashboard-table-action" type="button" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</button><button className="dashboard-primary-action" type="submit">Save skill <DashboardIcon name="arrow" /></button></div>
    </form>;
  }
  return <DashboardCollection title="Skills" kicker="Capabilities" description="Kelola teknologi, platform, dan kemampuan AI yang tampil di profil publik." actionLabel="View public about" actionPath="/about">
    <div className="dashboard-toolbar"><button className="dashboard-primary-action" type="button" onClick={() => setCreating(true)}><DashboardIcon name="plus" /> Add skill</button><label className="dashboard-search"><DashboardIcon name="search" /><span className="sr-only">Search skills</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search skills" /></label><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter skill category"><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={visibility} onChange={(event) => setVisibility(event.target.value)} aria-label="Filter skill visibility"><option value="">All visibility</option><option value="true">Visible</option><option value="false">Hidden</option></select></div>
    {status && <p className="dashboard-form-status" role="status">{status}</p>}
    <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Skill</th><th>Category</th><th>Order</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.nama}</strong></td><td>{item.kategori}</td><td>{item.urutan}</td><td><span className={`dashboard-status ${item.status_tampil ? "status-live" : "status-arsip"}`}>{item.status_tampil ? "Visible" : "Hidden"}</span></td><td><div className="dashboard-row-actions"><button className="dashboard-table-action" type="button" onClick={() => setEditing(item)}>Edit</button><button className={`dashboard-visibility-toggle${item.status_tampil ? " is-on" : ""}`} type="button" aria-pressed={item.status_tampil} onClick={() => void toggle(item)}><i aria-hidden="true" />{item.status_tampil ? "Visible" : "Hidden"}</button><button className="dashboard-table-action is-danger" type="button" onClick={() => void archive(item)}>Hide</button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <DashboardEmpty title="No skills found" text="Tambahkan skill atau ubah filter." />}</div>
    {creating && <DashboardModal title="Add skill" onClose={() => setCreating(false)}><SkillForm onSubmit={create} /></DashboardModal>}
    {editing && <DashboardModal title="Edit skill" onClose={() => setEditing(null)}><SkillForm item={editing} onSubmit={save} /></DashboardModal>}
  </DashboardCollection>;
}

function MessagesView({
  data,
  onChanged,
}: {
  data: Message[];
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = data.filter(
    (item) =>
      (!status || item.status === status) &&
      (!query ||
        `${item.nama} ${item.email} ${item.status}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  const allSelected =
    filtered.length > 0 && filtered.every((item) => selected.includes(item.id));
  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }
  function toggleAll() {
    setSelected(allSelected ? [] : filtered.map((item) => item.id));
  }
  async function archive(ids: string[]) {
    if (!ids.length) return;
    try {
      await Promise.all(ids.map((id) => updateContactStatus(id, "arsip")));
      setSelected([]);
      onChanged();
    } catch {
      /* status is reflected by the next refresh */
    }
  }
  return (
    <DashboardCollection
      title="Messages"
      kicker="Contact inbox"
      description="Pesan baru dari calon klien dan pengunjung."
      actionLabel="View public contact"
      actionPath="/contact"
    >
      <div className="dashboard-toolbar">
        <label className="dashboard-search">
          <DashboardIcon name="search" />
          <span className="sr-only">Search messages</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search messages"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter message status"
        >
          <option value="">All statuses</option>
          {Array.from(new Set(data.map((item) => item.status))).map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
        <button
          className="dashboard-bulk-action"
          type="button"
          disabled={!selected.length}
          onClick={() => void archive(selected)}
        >
          Bulk archive ({selected.length})
        </button>
      </div>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all filtered messages"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              <th>Contact</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.nama}`}
                    checked={selected.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                </td>
                <td>
                  <strong>{item.nama}</strong>
                </td>
                <td>{item.email}</td>
                <td>
                  <span className={`dashboard-status status-${item.status}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <div className="dashboard-row-actions">
                    <a
                      className="dashboard-table-link"
                      href={`mailto:${item.email}`}
                    >
                      View
                    </a>
                    <button
                      className="dashboard-table-action"
                      type="button"
                      onClick={() => void archive([item.id])}
                    >
                      Archive
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <DashboardEmpty
            title="Inbox is clear"
            text="Tidak ada pesan yang cocok."
          />
        )}
      </div>
    </DashboardCollection>
  );
}

function DashboardCollection({
  title,
  kicker,
  description,
  actionLabel,
  actionPath,
  children,
}: {
  title: string;
  kicker: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  children: ReactNode;
}) {
  const destination = actionPath === "/admin" ? "/dashboard" : actionPath;
  const visibleActionLabel = actionPath === "/admin" ? "Add" : actionLabel;
  return (
    <>
      <div className="dashboard-page-heading">
        <div>
          <p className="dashboard-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {!visibleActionLabel.startsWith("Add") && (
          <Link className="dashboard-primary-action" to={destination}>
            {visibleActionLabel} <DashboardIcon name="arrow" />
          </Link>
        )}
      </div>
      <section className="dashboard-panel dashboard-collection-panel">
        {children}
      </section>
    </>
  );
}

function DashboardEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="dashboard-empty">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function ProfileDropdown({
  email,
  name,
  onSaved,
  onLogout,
}: {
  email: string;
  name: string;
  onSaved: (email: string, name: string) => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await updateOwnerProfile({
        email: String(form.get("email") ?? ""),
        name: String(form.get("name") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      onSaved(String(form.get("email") ?? ""), String(form.get("name") ?? ""));
      setStatus("Profile updated.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Profile update failed.",
      );
    }
  }
  return (
    <div className="dashboard-profile-menu">
      <button
        className="dashboard-user dashboard-profile-trigger"
        type="button"
        aria-label="Open profile menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="dashboard-avatar">
          <img src="/brand-submark.png" alt="" aria-hidden="true" />
        </span>
      </button>
      {open && (
        <div className="dashboard-profile-popover">
          <div className="dashboard-profile-heading">
            <strong>Profile</strong>
            <button
              type="button"
              aria-label="Close profile settings"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <form className="dashboard-profile-form" onSubmit={save}>
            <label>
              Name
              <input name="name" defaultValue={name} required />
            </label>
            <label>
              Email
              <input name="email" type="email" defaultValue={email} required />
            </label>
            <label>
              New password
              <input
                name="password"
                type="password"
                minLength={8}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
            </label>
            <button className="dashboard-primary-action" type="submit">
              Save profile <DashboardIcon name="arrow" />
            </button>
            {status && (
              <small className="dashboard-form-status" role="status">
                {status}
              </small>
            )}
          </form>
          <button
            className="dashboard-profile-logout"
            type="button"
            onClick={onLogout}
          >
            <DashboardIcon name="logout" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function DashboardApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({
    portfolio: [],
    slides: [],
    materials: [],
    testimonials: [],
    messages: [],
    experience: [],
    skills: [],
  });
  const [profile, setProfile] = useState({ email: "", name: "" });
  const [dark, setDark] = useState(() => {
    const saved = window.localStorage.getItem("raydiansyah-theme");
    return saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () =>
      window.localStorage.getItem("raydiansyah-dashboard-sidebar") ===
      "collapsed",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    window.localStorage.setItem("raydiansyah-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getOwnerSession();
        const role = session.data.session?.user.app_metadata?.role;
        if (
          !session.data.session ||
          !["admin", "owner"].includes(String(role))
        ) {
          await navigate({ to: "/auth/login", replace: true });
          return;
        }
        const user = session.data.session.user;
        setProfile({
          email: user.email ?? "",
          name: String(
            user.user_metadata?.name ??
              user.user_metadata?.full_name ??
              "Raydiansyah",
          ),
        });
        const [
          portfolio,
          slides,
          materials,
          testimonials,
          messages,
          experience,
          skills,
        ] = await Promise.all([
          listOwnerPortfolio(),
          listSlides(),
          listMaterials(),
          listTestimonials(),
          listContactMessages(),
          listOwnerExperience(),
          listOwnerSkills(),
        ]);
        if (!cancelled)
          setData({
            portfolio,
            slides,
            materials,
            testimonials,
            messages: messages as Message[],
            experience,
            skills,
          });
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error
              ? caught.message
              : "Dashboard belum dapat dimuat.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);
  if (loading)
    return <div className="dashboard-loading">Loading workspace…</div>;
  if (error)
    return (
      <div className="dashboard-loading">
        <strong>Dashboard belum dapat dimuat.</strong>
        <span>{error}</span>
      </div>
    );
  const path = location.pathname;
  const content =
    path.includes("/portfolio") || path.includes("/portofoio") ? (
      <PortfolioView
        data={data.portfolio}
        onChanged={() =>
          void listOwnerPortfolio().then((portfolio) =>
            setData((current) => ({ ...current, portfolio })),
          )
        }
      />
    ) : path.includes("/slide") ? (
      <SlideView
        data={data.slides}
        materials={data.materials}
        onChanged={() =>
          void Promise.all([listSlides(), listMaterials()]).then(
            ([slides, materials]) =>
              setData((current) => ({ ...current, slides, materials })),
          )
        }
      />
    ) : path.includes("/experience") ? (
      <ExperienceView
        data={data.experience}
        onCreated={() =>
          void listOwnerExperience().then((experience) =>
            setData((current) => ({ ...current, experience })),
          )
        }
      />
    ) : path.includes("/skills") ? (
      <SkillsView
        data={data.skills}
        onChanged={() =>
          void listOwnerSkills().then((skills) =>
            setData((current) => ({ ...current, skills })),
          )
        }
      />
    ) : path.includes("/testimonials") ? (
      <TestimonialsView
        data={data.testimonials}
        onChanged={() =>
          void listTestimonials().then((testimonials) =>
            setData((current) => ({ ...current, testimonials })),
          )
        }
      />
    ) : path.includes("/messages") || path.includes("/contact") ? (
      <MessagesView
        data={data.messages}
        onChanged={() =>
          void listContactMessages().then((messages) =>
            setData((current) => ({
              ...current,
              messages: messages as Message[],
            })),
          )
        }
      />
    ) : (
      <Overview data={data} />
    );
  const logout = () =>
    void signOutOwner().then(() =>
      navigate({ to: "/auth/login", replace: true }),
    );
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    window.dispatchEvent(
      new CustomEvent("raydiansyah-theme-change", {
        detail: next ? "dark" : "light",
      }),
    );
  }
  function toggleSidebar() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    window.localStorage.setItem(
      "raydiansyah-dashboard-sidebar",
      next ? "collapsed" : "expanded",
    );
  }
  return (
    <div
      className={`dashboard-shell${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}
    >
      <DashboardNav
        pathname={path}
        onLogout={logout}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <Link className="dashboard-header-brand" to="/dashboard">
            <span className="dashboard-brand-name">raydiansyah</span>
            <span className="dashboard-brand-domain">.com</span>
          </Link>
          <label className="dashboard-global-search">
            <DashboardIcon name="search" />
            <input
              aria-label="Global dashboard search"
              placeholder="Search workspace"
            />
          </label>
          <div className="dashboard-topbar-actions">
            <button
              className="dashboard-theme-toggle"
              type="button"
              aria-pressed={dark}
              onClick={toggleTheme}
            >
              <DashboardIcon name={dark ? "sun" : "moon"} />
              <span>{dark ? "Light" : "Dark"}</span>
            </button>
            <span className="dashboard-online">
              <i /> Live
            </span>
            <ProfileDropdown
              email={profile.email}
              name={profile.name}
              onSaved={(email, name) => setProfile({ email, name })}
              onLogout={logout}
            />
          </div>
        </header>
        <div className="dashboard-content">{content}</div>
      </main>
    </div>
  );
}

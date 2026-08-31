/**
 * Module: Owner admin data service
 * Purpose: Provide authenticated Supabase operations for content management and inbox review
 * Used by: src/admin.tsx
 * Dependencies: Supabase browser client for metadata/Auth, shared file validation, and Cloudflare R2 presign endpoint for file bytes
 * Public functions: signInOwner(), signOutOwner(), getOwnerSession(), updateOwnerProfile(), listOwnerPortfolio(), listPortfolioClickStats(), createPortfolio(), updatePortfolio(), deletePortfolio(), listTestimonials(), createTestimonial(), updateTestimonial(), deleteTestimonial(), listMaterials(), createMaterial(), updateMaterial(), deleteMaterial(), listSlides(), updateSlide(), replaceSlideFile(), updateSlideOrder(), deleteSlide(), listOwnerExperience(), createExperience(), updateExperience(), deleteExperience(), listOwnerSkills(), createSkill(), updateSkill(), deleteSkill(), slugify(), validateSlideSlug(), uploadSlide(), uploadPortfolioCover(), listContactMessages()
 * Side effects: Auth session persistence, authenticated database reads/writes, and HTTP uploads with progress callbacks
 */
import { getSupabaseClient } from "./supabase";
import type { Portfolio } from "./portfolio";
import {
  validateUploadFile,
  PORTFOLIO_COVER_RULE,
  SLIDE_RULE,
} from "./file-validation";

export async function signInOwner(
  email: string,
  password: string,
  captchaToken: string,
) {
  return getSupabaseClient().auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });
}
export async function signOutOwner() {
  return getSupabaseClient().auth.signOut();
}
export async function getOwnerSession() {
  return getSupabaseClient().auth.getSession();
}
export async function updateOwnerProfile(input: {
  email: string;
  name: string;
  password?: string;
}) {
  const updates: {
    email?: string;
    password?: string;
    data?: { name: string };
  } = { email: input.email.trim(), data: { name: input.name.trim() } };
  if (input.password?.trim()) updates.password = input.password.trim();
  const { error } = await getSupabaseClient().auth.updateUser(updates);
  if (error) throw error;
}
export async function listOwnerPortfolio(): Promise<Portfolio[]> {
  const { data, error } = await getSupabaseClient()
    .from("portofolio")
    .select("id, judul, slug, kategori, ringkasan, url_gambar, url_demo")
    .order("tanggal", { ascending: false });
  if (error) throw error;
  return data as Portfolio[];
}
export type PortfolioClickStat = { portfolio_id: string; judul: string; clicked_date: string; click_count: number };
export async function listPortfolioClickStats(): Promise<PortfolioClickStat[]> {
  const { data, error } = await getSupabaseClient()
    .from("portfolio_click_daily")
    .select("portfolio_id, judul, clicked_date, click_count")
    .order("clicked_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PortfolioClickStat[];
}
export async function createPortfolio(
  input: Pick<
    Portfolio,
    "judul" | "slug" | "kategori" | "ringkasan" | "url_gambar" | "url_demo"
  >,
) {
  const {
    data: { user },
  } = await getSupabaseClient().auth.getUser();
  if (!user) throw new Error("Owner session required");
  const { error } = await getSupabaseClient()
    .from("portofolio")
    .insert({ ...input, created_by: user.id });
  if (error) throw error;
}
export async function updatePortfolio(
  id: string,
  input: Partial<
    Pick<
      Portfolio,
      "judul" | "slug" | "kategori" | "ringkasan" | "url_gambar" | "url_demo"
    >
  >,
) {
  const { error } = await getSupabaseClient()
    .from("portofolio")
    .update(input)
    .eq("id", id);
  if (error) throw error;
}
export async function deletePortfolio(id: string) {
  const { error } = await getSupabaseClient()
    .from("portofolio")
    .update({ status_tampil: false })
    .eq("id", id);
  if (error) throw error;
}
export type Testimonial = {
  id: string;
  nama: string;
  jabatan: string | null;
  kutipan: string;
  status_tampil: boolean;
};
export async function listTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await getSupabaseClient()
    .from("testimoni")
    .select("id, nama, jabatan, kutipan, status_tampil")
    .order("tanggal", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function createTestimonial(
  input: Pick<Testimonial, "nama" | "jabatan" | "kutipan">,
) {
  const {
    data: { user },
  } = await getSupabaseClient().auth.getUser();
  if (!user) throw new Error("Owner session required");
  const { error } = await getSupabaseClient()
    .from("testimoni")
    .insert({ ...input, created_by: user.id });
  if (error) throw error;
}
export async function updateTestimonial(
  id: string,
  input: Partial<
    Pick<Testimonial, "nama" | "jabatan" | "kutipan" | "status_tampil">
  >,
) {
  const { error } = await getSupabaseClient()
    .from("testimoni")
    .update(input)
    .eq("id", id);
  if (error) throw error;
}
export async function deleteTestimonial(id: string) {
  return updateTestimonial(id, { status_tampil: false });
}
export type Slide = {
  id: string;
  judul: string;
  slug: string;
  mime_type: string;
  storage_path: string;
  material_id: string | null;
  urutan: number;
  created_by: string;
  status_tampil: boolean;
};
export type Material = {
  id: string;
  judul: string;
  slug: string;
  deskripsi: string;
  status_tampil: boolean;
  akses_kode: string | null;
  akses_berakhir_pada: string | null;
};
export async function listMaterials(): Promise<Material[]> {
  const { data, error } = await getSupabaseClient()
    .from("material")
    .select("id, judul, slug, deskripsi, status_tampil, akses_kode, akses_berakhir_pada")
    .order("dibuat_pada", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function createMaterial(
  input: Pick<Material, "judul" | "slug" | "deskripsi" | "akses_kode" | "akses_berakhir_pada">,
) {
  const {
    data: { user },
  } = await getSupabaseClient().auth.getUser();
  if (!user) throw new Error("Owner session required");
  const { data, error } = await getSupabaseClient()
    .from("material")
    .insert({ ...input, created_by: user.id })
    .select("id, judul, slug, deskripsi, status_tampil, akses_kode, akses_berakhir_pada")
    .single();
  if (error) throw error;
  return data as Material;
}
export async function updateMaterial(
  id: string,
  input: Partial<
    Pick<Material, "judul" | "slug" | "deskripsi" | "status_tampil" | "akses_kode" | "akses_berakhir_pada">
  >,
) {
  const { error } = await getSupabaseClient()
    .from("material")
    .update({ ...input, diperbarui_pada: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
export async function deleteMaterial(id: string) {
  return updateMaterial(id, { status_tampil: false });
}
export async function listSlides(): Promise<Slide[]> {
  const { data, error } = await getSupabaseClient()
    .from("slide_presentasi")
    .select(
      "id, judul, slug, mime_type, storage_path, material_id, urutan, created_by, status_tampil",
    )
    .order("urutan", { ascending: true })
    .order("dibuat_pada", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function updateSlide(
  id: string,
  input: Partial<Pick<Slide, "judul" | "slug" | "material_id" | "urutan" | "status_tampil">>,
) {
  const { error } = await getSupabaseClient()
    .from("slide_presentasi")
    .update(input)
    .eq("id", id);
  if (error) throw error;
}
export async function updateSlideOrder(
  slides: Pick<
    Slide,
    | "id"
    | "judul"
    | "slug"
    | "mime_type"
    | "storage_path"
    | "material_id"
    | "urutan"
    | "created_by"
  >[],
) {
  if (!slides.length) return;
  const { error } = await getSupabaseClient()
    .from("slide_presentasi")
    .upsert(slides, { onConflict: "id" });
  if (error) throw error;
}
export async function deleteSlide(id: string) {
  const { error } = await getSupabaseClient()
    .from("slide_presentasi")
    .update({ status_tampil: false })
    .eq("id", id);
  if (error) throw error;
}
export type Experience = {
  id: string;
  periode: string;
  judul: string;
  ringkasan: string;
  stack: string;
  urutan: number;
  status_tampil: boolean;
};
export async function listOwnerExperience(): Promise<Experience[]> {
  const { data, error } = await getSupabaseClient()
    .from("pengalaman")
    .select("id, periode, judul, ringkasan, stack, urutan, status_tampil")
    .order("urutan", { ascending: true })
    .order("dibuat_pada", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
export async function createExperience(
  input: Pick<
    Experience,
    "periode" | "judul" | "ringkasan" | "stack" | "urutan"
  >,
) {
  const {
    data: { user },
  } = await getSupabaseClient().auth.getUser();
  if (!user) throw new Error("Owner session required");
  const { error } = await getSupabaseClient().from("pengalaman").insert(input);
  if (error) throw error;
}
export async function updateExperience(
  id: string,
  input: Partial<
    Pick<
      Experience,
      "periode" | "judul" | "ringkasan" | "stack" | "urutan" | "status_tampil"
    >
  >,
) {
  const { error } = await getSupabaseClient()
    .from("pengalaman")
    .update({ ...input, diperbarui_pada: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
export async function deleteExperience(id: string) {
  return updateExperience(id, { status_tampil: false });
}
export type Skill = {
  id: string;
  nama: string;
  kategori: string;
  urutan: number;
  status_tampil: boolean;
};
export async function listOwnerSkills(): Promise<Skill[]> {
  const { data, error } = await getSupabaseClient()
    .from("keahlian")
    .select("id, nama, kategori, urutan, status_tampil")
    .order("urutan", { ascending: true })
    .order("dibuat_pada", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
export async function createSkill(
  input: Pick<Skill, "nama" | "kategori" | "urutan">,
) {
  const { error } = await getSupabaseClient().from("keahlian").insert(input);
  if (error) throw error;
}
export async function updateSkill(
  id: string,
  input: Partial<Pick<Skill, "nama" | "kategori" | "urutan" | "status_tampil">>,
) {
  const { error } = await getSupabaseClient()
    .from("keahlian")
    .update({ ...input, diperbarui_pada: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
export async function deleteSkill(id: string) {
  return updateSkill(id, { status_tampil: false });
}
export type UploadProgress = {
  phase: "preparing" | "uploading" | "saving";
  percent: number;
};
export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function validateSlideSlug(value: string, slides: Pick<Slide, "id" | "slug">[] = [], currentId?: string) {
  const slug = value.trim();
  if (!slug) return "Custom slug wajib diisi atau gunakan slug otomatis dari judul.";
  if (slug.length > 80) return "Custom slug maksimal 80 karakter.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Custom slug hanya boleh berisi huruf kecil, angka, dan tanda hubung tunggal.";
  }
  if (slides.some((item) => item.id !== currentId && item.slug === slug)) {
    return "Custom slug sudah digunakan slide lain.";
  }
  return null;
}

function uploadToR2(
  url: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.timeout = 120_000;
    request.setRequestHeader("Content-Type", file.type);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable)
        onProgress?.({
          phase: "uploading",
          percent: Math.round((event.loaded / event.total) * 100),
        });
    });
    request.addEventListener("load", () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`Upload file gagal (HTTP ${request.status}).`)),
    );
    request.addEventListener("error", () =>
      reject(new Error("Upload file gagal karena koneksi terputus.")),
    );
    request.addEventListener("abort", () =>
      reject(new Error("Upload file dibatalkan.")),
    );
    request.addEventListener("timeout", () =>
      reject(new Error("Upload file timeout setelah 2 menit.")),
    );
    request.send(file);
  });
}

export async function uploadSlide(
  file: File,
  judul: string,
  slug: string,
  optionsOrProgress?:
    | {
        materialId?: string | null;
        urutan?: number;
        onProgress?: (progress: UploadProgress) => void;
      }
    | ((progress: UploadProgress) => void),
) {
  const options =
    typeof optionsOrProgress === "function"
      ? { onProgress: optionsOrProgress }
      : (optionsOrProgress ?? {});
  const validationError = validateUploadFile(file, SLIDE_RULE);
  if (validationError) throw new Error(validationError);
  const normalizedSlug = slugify(slug || judul);
  if (!normalizedSlug)
    throw new Error("Judul slide harus menghasilkan slug yang valid.");
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!user || !session?.access_token)
    throw new Error("Owner session required.");
  const { key } = await uploadSlideAsset(file, normalizedSlug, session.access_token, options.onProgress);
  options.onProgress?.({ phase: "saving", percent: 100 });
  const inserted = await supabase.from("slide_presentasi").insert({
    judul: judul.trim(),
    slug: normalizedSlug,
    storage_path: key,
    mime_type: file.type,
    material_id: options.materialId ?? null,
    urutan: options.urutan ?? 0,
    created_by: user.id,
  });
  if (inserted.error)
    throw new Error(
      `File sudah terupload, tetapi metadata gagal disimpan: ${inserted.error.message}`,
    );
}

async function uploadSlideAsset(
  file: File,
  slug: string,
  accessToken: string,
  onProgress?: (progress: UploadProgress) => void,
) {
  onProgress?.({ phase: "preparing", percent: 0 });
  const endpoint = import.meta.env.VITE_R2_UPLOAD_ENDPOINT;
  if (!endpoint) throw new Error("Missing VITE_R2_UPLOAD_ENDPOINT.");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);
  let presign: Response;
  try {
    presign = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ filename: file.name, contentType: file.type, slug }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("Server upload tidak merespons dalam 30 detik.");
    throw new Error("Gagal menghubungi server upload.");
  } finally {
    window.clearTimeout(timeout);
  }
  if (!presign.ok) throw new Error(`Gagal menyiapkan upload (HTTP ${presign.status}).`);
  const { url, key } = (await presign.json()) as { url: string; key: string };
  await uploadToR2(url, file, onProgress);
  return { key };
}

export async function replaceSlideFile(id: string, file: File, slug: string, onProgress?: (progress: UploadProgress) => void) {
  const validationError = validateUploadFile(file, SLIDE_RULE);
  if (validationError) throw new Error(validationError);
  const normalizedSlug = slugify(slug);
  if (!normalizedSlug) throw new Error("Slug slide tidak valid.");
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Owner session required.");
  const { key } = await uploadSlideAsset(file, normalizedSlug, session.access_token, onProgress);
  onProgress?.({ phase: "saving", percent: 100 });
  const { error } = await supabase.from("slide_presentasi").update({ storage_path: key, mime_type: file.type }).eq("id", id);
  if (error) throw new Error(`File baru terupload, tetapi metadata gagal diperbarui: ${error.message}`);
}
export async function uploadPortfolioCover(
  file: File,
  slug: string,
): Promise<string> {
  const validationError = validateUploadFile(file, PORTFOLIO_COVER_RULE);
  if (validationError) throw new Error(validationError);
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Owner session required.");
  const endpoint = import.meta.env.VITE_R2_UPLOAD_ENDPOINT;
  const baseUrl = import.meta.env.VITE_R2_PUBLIC_BASE_URL;
  if (!endpoint || !baseUrl)
    throw new Error("Konfigurasi upload cover belum tersedia.");
  const normalizedSlug = slugify(slug) || "portfolio";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      slug: `${normalizedSlug}-cover`,
    }),
  });
  if (!response.ok)
    throw new Error(`Gagal menyiapkan cover (HTTP ${response.status}).`);
  const { url, key } = (await response.json()) as { url: string; key: string };
  await uploadToR2(url, file);
  return `${baseUrl.replace(/\/$/, "")}/${key}`;
}
export async function listContactMessages() {
  const { data, error } = await getSupabaseClient()
    .from("pesan_kontak")
    .select("id, nama, email, status, dibuat_pada")
    .order("dibuat_pada", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function updateContactStatus(id: string, status: string) {
  const { error } = await getSupabaseClient()
    .from("pesan_kontak")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

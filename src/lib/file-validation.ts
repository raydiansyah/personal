/**
 * Module: Client upload validation helpers
 * Purpose: Validate file size, extension, and MIME type before upload
 * Used by: Dashboard and legacy owner upload forms
 * Dependencies: Browser File API
 * Public functions: validateUploadFile(), formatFileSize()
 * Side effects: None
 */
export type UploadRule = {
  label: string;
  maxBytes: number;
  extensions: string[];
  mimeTypes: string[];
};

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateUploadFile(
  file: File | null | undefined,
  rule: UploadRule,
) {
  if (!file || !file.size) return `Pilih ${rule.label} terlebih dahulu.`;
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (
    !rule.extensions.includes(extension) &&
    !rule.mimeTypes.includes(file.type)
  ) {
    return `Format tidak valid. Gunakan ${rule.extensions.join(", ")}.`;
  }
  if (file.size > rule.maxBytes)
    return `Ukuran file maksimal ${formatFileSize(rule.maxBytes)}.`;
  return "";
}

export const PORTFOLIO_COVER_RULE: UploadRule = {
  label: "cover gambar",
  maxBytes: 5 * 1024 * 1024,
  extensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};

export const SLIDE_RULE: UploadRule = {
  label: "file slide",
  maxBytes: 10 * 1024 * 1024,
  extensions: [".html", ".pdf"],
  mimeTypes: ["text/html", "application/pdf"],
};

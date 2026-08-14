import { getSession } from "@/lib/auth";

export type ExportFormat = "xlsx" | "pdf";

export function buildExportUrl(
  base: string,
  options: {
    format: ExportFormat;
    filename?: string;
    from?: string;
    to?: string;
    types?: string[];
  },
): string {
  const params = new URLSearchParams();
  params.set("format", options.format);
  if (options.filename) params.set("filename", options.filename);
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);
  if (options.types && options.types.length > 0) {
    params.set("types", options.types.join(","));
  }
  return `${base}?${params.toString()}`;
}

export function parseExportFormat(value: string | null): ExportFormat | null {
  if (value === "pdf") return "pdf";
  if (value === "xlsx") return "xlsx";
  return null;
}

export function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function sanitizeFilename(value: string | null): string {
  if (!value) return "exporte";
  const cleaned = value.replace(/[^a-zA-Z0-9-_áéíóúÁÉÍÓÚñÑ]/g, "").slice(0, 80);
  return cleaned || "exporte";
}

export async function getExportSession() {
  const session = await getSession();
  return session;
}

export function buildExportResponse(
  buffer: Buffer,
  format: ExportFormat,
  filename: string,
): Response {
  const extension = format === "xlsx" ? "xlsx" : "pdf";
  const contentType =
    format === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf";
  const encoded = encodeURIComponent(`${filename}.${extension}`);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}

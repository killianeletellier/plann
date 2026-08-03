import { z } from "zod";

/** Palette prédéfinie pour les couleurs de mission */
export const MISSION_COLOR_PALETTE = [
  "#3B82F6",
  "#9333EA",
  "#059669",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#A855F7",
  "#EAB308",
  "#64748B",
  "#DC2626",
] as const;

export const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Couleur hex invalide (#RGB ou #RRGGBB)");

export function normalizeHexColor(color: string): string {
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    const [, r, g, b] = color;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return color.toUpperCase();
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Génère une couleur par défaut à partir du nom de la mission */
export function defaultMissionColor(name: string): string {
  const index = hashString(name.trim().toLowerCase()) % MISSION_COLOR_PALETTE.length;
  return MISSION_COLOR_PALETTE[index]!;
}

export const GANTT_UNASSIGNED_BORDER = "#F59E0B";
export const GANTT_OVERDUE_BORDER = "#EF4444";

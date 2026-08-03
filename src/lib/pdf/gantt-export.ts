import { format, parseISO } from "date-fns";
import type { GanttDay, GanttRow, GanttViewMode } from "@/lib/gantt-data";
import {
  computeDayTimeRange,
  formatGanttDayLabel,
  ganttModeLabels,
} from "@/lib/gantt-data";

const MODE_FILENAME_PREFIX: Record<GanttViewMode, string> = {
  location: "lieu",
  volunteer: "benevole",
  scene: "scene",
};

export interface GanttTimeline {
  minTime: number;
  maxTime: number;
  hourLabels: string[];
  dateLabel: string;
}

export function computeGanttTimeline(rows: GanttRow[], day: GanttDay): GanttTimeline {
  const { minTime, maxTime, hourLabels } = computeDayTimeRange(rows, day);
  return {
    minTime,
    maxTime,
    hourLabels,
    dateLabel: formatGanttDayLabel(day),
  };
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDaySlug(day: GanttDay): string {
  return format(parseISO(day), "yyyy-MM-dd");
}

export function buildGanttPdfFilename(
  mode: GanttViewMode,
  selectedLabels: string[],
  day: GanttDay,
): string {
  const prefix = MODE_FILENAME_PREFIX[mode];
  const names = selectedLabels.map(slugify).filter(Boolean);
  const suffix = names.length > 0 ? names.join("-") : "export";
  return `gantt-${prefix}-${suffix}-${formatDaySlug(day)}.pdf`;
}

export function buildGanttPdfTitle(
  mode: GanttViewMode,
  selectedLabels: string[],
  day: GanttDay,
): string {
  const modeLabel = ganttModeLabels[mode];
  const selection =
    selectedLabels.length === 0
      ? "Sélection"
      : selectedLabels.length <= 3
        ? selectedLabels.join(", ")
        : `${selectedLabels.slice(0, 2).join(", ")} (+${selectedLabels.length - 2})`;
  const dateLabel = formatGanttDayLabel(day);
  return `Gantt — ${modeLabel} — ${selection} — ${dateLabel}`;
}

export function ganttRowsHaveSlots(rows: GanttRow[]): boolean {
  return rows.some((r) => r.slots.length > 0);
}

export async function downloadGanttPdf(options: {
  mode: GanttViewMode;
  rows: GanttRow[];
  selectedLabels: string[];
  day: GanttDay;
  showGroups?: boolean;
  festivalDateLabel?: string;
}): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");
  const { GanttPdfDocument } = await import("@/lib/pdf/gantt-template");

  const timeline = computeGanttTimeline(options.rows, options.day);
  const title = buildGanttPdfTitle(options.mode, options.selectedLabels, options.day);
  const filename = buildGanttPdfFilename(options.mode, options.selectedLabels, options.day);

  const blob = await pdf(
    GanttPdfDocument({
      title,
      dateLabel: timeline.dateLabel,
      festivalDateLabel: options.festivalDateLabel,
      hourLabels: timeline.hourLabels,
      rows: options.rows,
      showGroups: options.showGroups ?? false,
      minTime: timeline.minTime,
      maxTime: timeline.maxTime,
    }),
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

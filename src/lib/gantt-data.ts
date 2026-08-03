import { addDays, format, isValid, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { formatVolunteers } from "@/lib/volunteer-display";
import {
  isAnimationUnassigned,
  isSlotUnassigned,
  isTaskUnassigned,
} from "@/lib/unassigned";
import { isTaskOverdue } from "@/lib/task-overdue";
import { defaultMissionColor } from "@/lib/mission-color";
import type { TaskStatus } from "@/lib/task-status";

export type GanttViewMode = "location" | "volunteer" | "scene";

export type GanttSlotKind = "slot" | "animation" | "task";

export interface GanttSlot {
  id: string;
  startAt: string;
  endAt: string;
  label?: string;
  color: string;
  missionId?: string;
  missionLabel?: string;
  unassigned?: boolean;
  overdue?: boolean;
  kind?: GanttSlotKind;
}

export interface GanttLegendItem {
  id: string;
  label: string;
  color: string;
}

export interface GanttRow {
  id: string;
  title: string;
  subtitle?: string;
  group?: string;
  slots: GanttSlot[];
}

interface LocationRef {
  id: string;
  name: string;
  type: string;
}

interface VolunteerRef {
  id: string;
  firstName: string;
  lastName: string;
}

interface ApiAnimation {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  color?: string;
  locationId: string;
  artistId?: string | null;
  artist?: { name: string } | null;
  location?: { id: string; name: string } | null;
  volunteers?: Array<{ userId: string; user?: { firstName: string; lastName: string } | null }>;
}

interface ApiTask {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  color?: string;
  status?: TaskStatus;
  locationId?: string | null;
  location?: { id: string; name: string } | null;
  volunteers?: Array<{ userId: string; user?: { firstName: string; lastName: string } | null }>;
}

interface ApiSlot {
  id: string;
  startAt: string;
  endAt: string;
  postId: string;
  post?: {
    title: string;
    color?: string;
    locationId: string;
    location?: { id: string; name: string } | null;
  } | null;
  volunteers?: Array<{ userId: string; user?: { firstName: string; lastName: string } | null }>;
}

interface ApiPost {
  id: string;
  title: string;
  color?: string;
  locationId: string;
  location?: { name: string } | null;
  slots?: Array<{
    id: string;
    startAt: string;
    endAt: string;
    volunteers?: Array<{
      userId: string;
      user?: { firstName: string; lastName: string } | null;
    }>;
  }>;
}

const UNASSIGNED_ROW_ID = "unassigned";

function volunteerDisplayName(v: {
  user?: { firstName: string; lastName: string } | null;
}): string | null {
  if (!v.user) return null;
  return `${v.user.firstName} ${v.user.lastName}`;
}

function sortLocationGanttRows(rows: GanttRow[]): GanttRow[] {
  rows.sort((a, b) => {
    if (a.id === UNASSIGNED_ROW_ID) return 1;
    if (b.id === UNASSIGNED_ROW_ID) return -1;
    return a.title.localeCompare(b.title, "fr");
  });
  for (const row of rows) {
    row.slots.sort((a, b) => a.startAt.localeCompare(b.startAt));
  }
  return rows;
}

function animationPeople(a: ApiAnimation): string {
  const parts: string[] = [];
  if (a.artist?.name) parts.push(a.artist.name);
  parts.push(...formatVolunteers(a.volunteers));
  return parts.join(", ");
}

export function buildLocationGanttRows(
  locationId: string,
  posts: ApiPost[],
  animations: ApiAnimation[],
  tasks: ApiTask[],
): GanttRow[] {
  const rowMap = new Map<string, GanttRow>();

  function getOrCreateRow(id: string, title: string, subtitle?: string): GanttRow {
    let row = rowMap.get(id);
    if (!row) {
      row = { id, title, subtitle, slots: [] };
      rowMap.set(id, row);
    }
    return row;
  }

  function addUnassignedSlot(slot: GanttSlot) {
    getOrCreateRow(UNASSIGNED_ROW_ID, "Sans bénévole").slots.push(slot);
  }

  function addVolunteerSlot(userId: string, name: string, slot: GanttSlot) {
    getOrCreateRow(`vol-${userId}`, name).slots.push(slot);
  }

  function distributeToVolunteers(
    volunteers: ApiAnimation["volunteers"],
    baseSlot: Omit<GanttSlot, "id"> & { id: string },
  ) {
    for (const v of volunteers ?? []) {
      const name = volunteerDisplayName(v);
      if (!name) continue;
      addVolunteerSlot(v.userId, name, {
        ...baseSlot,
        id: `${baseSlot.id}-${v.userId}`,
        unassigned: false,
      });
    }
  }

  for (const post of posts.filter((p) => p.locationId === locationId)) {
    const missionColor = post.color ?? defaultMissionColor(post.title);
    for (const slot of post.slots ?? []) {
      const baseSlot = {
        id: slot.id,
        startAt: slot.startAt,
        endAt: slot.endAt,
        kind: "slot" as const,
        label: post.title,
        color: missionColor,
        missionId: post.id,
        missionLabel: post.title,
        unassigned: isSlotUnassigned(slot.volunteers),
      };

      if (isSlotUnassigned(slot.volunteers)) {
        addUnassignedSlot(baseSlot);
      } else {
        distributeToVolunteers(slot.volunteers, baseSlot);
      }
    }
  }

  for (const anim of animations.filter((a) => a.locationId === locationId)) {
    const missionColor = anim.color ?? defaultMissionColor(anim.title);
    const baseSlot = {
      id: anim.id,
      startAt: anim.startAt,
      endAt: anim.endAt,
      kind: "animation" as const,
      label: `Animation — ${anim.title}`,
      color: missionColor,
      missionId: anim.id,
      missionLabel: anim.title,
      unassigned: isAnimationUnassigned(anim.volunteers, anim.artistId),
    };

    if (isAnimationUnassigned(anim.volunteers, anim.artistId)) {
      addUnassignedSlot(baseSlot);
    } else if (anim.volunteers && anim.volunteers.length > 0) {
      distributeToVolunteers(anim.volunteers, baseSlot);
    } else if (anim.artist?.name) {
      getOrCreateRow(`artist-${anim.artistId ?? anim.id}`, anim.artist.name, "Artiste").slots.push({
        ...baseSlot,
        unassigned: false,
      });
    }
  }

  for (const task of tasks.filter((t) => t.locationId === locationId)) {
    const missionColor = task.color ?? defaultMissionColor(task.title);
    const baseSlot = {
      id: task.id,
      startAt: task.startAt,
      endAt: task.endAt,
      kind: "task" as const,
      label: `Tâche — ${task.title}`,
      color: missionColor,
      missionId: task.id,
      missionLabel: task.title,
      unassigned: isTaskUnassigned(task.volunteers),
      overdue: isTaskOverdue(task.endAt, task.status ?? "a_faire"),
    };

    if (isTaskUnassigned(task.volunteers)) {
      addUnassignedSlot(baseSlot);
    } else {
      distributeToVolunteers(task.volunteers, baseSlot);
    }
  }

  return sortLocationGanttRows([...rowMap.values()]);
}

export function buildVolunteerGanttRows(
  userId: string,
  slots: ApiSlot[],
  animations: ApiAnimation[],
  tasks: ApiTask[],
  locations: LocationRef[],
): GanttRow[] {
  const locName = (id?: string | null) =>
    locations.find((l) => l.id === id)?.name ?? "Sans lieu";

  const rows: GanttRow[] = [];

  for (const slot of slots.filter((s) =>
    s.volunteers?.some((v) => v.userId === userId),
  )) {
    const postTitle = slot.post?.title ?? "Poste";
    const missionColor = slot.post?.color ?? defaultMissionColor(postTitle);
    rows.push({
      id: `slot-${slot.id}`,
      title: postTitle,
      subtitle: "Créneau de poste",
      group: locName(slot.post?.locationId ?? slot.post?.location?.id),
      slots: [
        {
          id: slot.id,
          startAt: slot.startAt,
          endAt: slot.endAt,
          kind: "slot",
          color: missionColor,
          missionId: slot.postId,
          missionLabel: postTitle,
          unassigned: false,
        },
      ],
    });
  }

  for (const anim of animations.filter((a) =>
    a.volunteers?.some((v) => v.userId === userId),
  )) {
    const missionColor = anim.color ?? defaultMissionColor(anim.title);
    rows.push({
      id: `anim-${anim.id}`,
      title: anim.title,
      subtitle: anim.artist?.name ? `Artiste : ${anim.artist.name}` : "Animation",
      group: locName(anim.locationId ?? anim.location?.id),
      slots: [
        {
          id: anim.id,
          startAt: anim.startAt,
          endAt: anim.endAt,
          kind: "animation",
          color: missionColor,
          missionId: anim.id,
          missionLabel: anim.title,
          unassigned: false,
        },
      ],
    });
  }

  for (const task of tasks.filter((t) =>
    t.volunteers?.some((v) => v.userId === userId),
  )) {
    const missionColor = task.color ?? defaultMissionColor(task.title);
    rows.push({
      id: `task-${task.id}`,
      title: task.title,
      subtitle: "Tâche",
      group: locName(task.locationId ?? task.location?.id),
      slots: [
        {
          id: task.id,
          startAt: task.startAt,
          endAt: task.endAt,
          kind: "task",
          color: missionColor,
          missionId: task.id,
          missionLabel: task.title,
          unassigned: false,
          overdue: isTaskOverdue(task.endAt, task.status ?? "a_faire"),
        },
      ],
    });
  }

  rows.sort((a, b) => {
    const ga = a.group ?? "";
    const gb = b.group ?? "";
    if (ga !== gb) return ga.localeCompare(gb, "fr");
    const ta = a.slots[0]?.startAt ?? "";
    const tb = b.slots[0]?.startAt ?? "";
    return ta.localeCompare(tb);
  });

  return rows;
}

export function buildSceneGanttRows(
  locationId: string,
  animations: ApiAnimation[],
): GanttRow[] {
  return animations
    .filter((a) => a.locationId === locationId)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .map((anim) => {
      const missionColor = anim.color ?? defaultMissionColor(anim.title);
      return {
        id: `anim-${anim.id}`,
        title: anim.title,
        subtitle: animationPeople(anim) || undefined,
        slots: [
          {
            id: anim.id,
            startAt: anim.startAt,
            endAt: anim.endAt,
            kind: "animation" as const,
            label: anim.artist?.name ?? anim.title,
            color: missionColor,
            missionId: anim.id,
            missionLabel: anim.title,
            unassigned: isAnimationUnassigned(anim.volunteers, anim.artistId),
          },
        ],
      };
    });
}

export function ganttFilterItems(
  mode: GanttViewMode,
  locations: LocationRef[],
  volunteers: VolunteerRef[],
) {
  if (mode === "volunteer") {
    return volunteers.map((v) => ({
      id: v.id,
      label: v.firstName,
      subtitle: v.lastName,
    }));
  }

  const locs =
    mode === "scene"
      ? locations.filter((l) => l.type === "scene")
      : locations;

  return locs.map((loc) => ({
    id: loc.id,
    label: loc.name,
    badge:
      mode === "location"
        ? {
            text:
              loc.type === "scene"
                ? "Scène"
                : loc.type === "point_de_vente"
                  ? "Point de vente"
                  : "Autre",
            variant:
              (loc.type === "scene"
                ? "scene"
                : loc.type === "point_de_vente"
                  ? "vente"
                  : "default") as "default" | "scene" | "vente",
          }
        : { text: "Scène", variant: "scene" as const },
  }));
}

export const ganttModeLabels: Record<GanttViewMode, string> = {
  location: "Par lieu",
  volunteer: "Par bénévole",
  scene: "Par scène",
};

export const GANTT_VIEW_MODES: GanttViewMode[] = ["location", "volunteer", "scene"];

/** Missions uniques présentes dans la timeline, pour la légende */
export function extractGanttLegend(rows: GanttRow[]): GanttLegendItem[] {
  const map = new Map<string, GanttLegendItem>();
  for (const row of rows) {
    for (const slot of row.slots) {
      if (slot.missionId && slot.missionLabel) {
        map.set(slot.missionId, {
          id: slot.missionId,
          label: slot.missionLabel,
          color: slot.color,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function ganttHasStatusIndicator(
  rows: GanttRow[],
  indicator: "unassigned" | "overdue",
): boolean {
  return rows.some((row) =>
    row.slots.some((slot) =>
      indicator === "unassigned" ? slot.unassigned : slot.overdue,
    ),
  );
}

/** yyyy-MM-dd */
export type GanttDay = string;

function dayBounds(day: GanttDay): { start: Date; end: Date } {
  const start = startOfDay(parseISO(day));
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function slotIntersectsDay(
  startAt: string,
  endAt: string,
  day: GanttDay,
): boolean {
  const { start, end } = dayBounds(day);
  const slotStart = parseISO(startAt).getTime();
  const slotEnd = parseISO(endAt).getTime();
  return slotStart <= end.getTime() && slotEnd >= start.getTime();
}

/** Tronque un créneau aux bornes du jour ; null s'il n'intersecte pas ce jour. */
export function clipSlotToDay(slot: GanttSlot, day: GanttDay): GanttSlot | null {
  if (!slotIntersectsDay(slot.startAt, slot.endAt, day)) return null;

  const { start: dayStart, end: dayEnd } = dayBounds(day);
  const slotStart = parseISO(slot.startAt);
  const slotEnd = parseISO(slot.endAt);

  const clippedStart = slotStart < dayStart ? dayStart : slotStart;
  const clippedEnd = slotEnd > dayEnd ? dayEnd : slotEnd;

  return {
    ...slot,
    startAt: clippedStart.toISOString(),
    endAt: clippedEnd.toISOString(),
  };
}

/** Ne conserve que les lignes avec créneaux intersectant le jour, slots tronqués. */
export function filterGanttRowsByDay(rows: GanttRow[], day: GanttDay): GanttRow[] {
  return rows
    .map((row) => ({
      ...row,
      slots: row.slots
        .map((s) => clipSlotToDay(s, day))
        .filter((s): s is GanttSlot => s !== null),
    }))
    .filter((row) => row.slots.length > 0);
}

/** Jours calendaires couverts par un intervalle startAt/endAt. */
export function daysSpannedByInterval(startAt: string, endAt: string): GanttDay[] {
  const days: GanttDay[] = [];
  let current = startOfDay(parseISO(startAt));
  const end = parseISO(endAt);

  while (current.getTime() <= end.getTime()) {
    days.push(format(current, "yyyy-MM-dd"));
    current = addDays(current, 1);
  }

  return days;
}

/** Jours distincts présents dans une liste d'intervalles. */
export function collectDaysFromIntervals(
  items: Array<{ startAt: string; endAt: string }>,
): GanttDay[] {
  const days = new Set<GanttDay>();
  for (const item of items) {
    for (const day of daysSpannedByInterval(item.startAt, item.endAt)) {
      days.add(day);
    }
  }
  return [...days].sort();
}

export function formatGanttDayLabel(day: GanttDay): string {
  return format(parseISO(day), "d MMMM yyyy", { locale: fr });
}

export function formatGanttDayShort(day: GanttDay): string {
  return format(parseISO(day), "EEE d MMM", { locale: fr });
}

/** Jour affiché : param URL valide, sinon aujourd'hui (date locale). */
export function resolveDefaultGanttDay(urlDate?: string | null): GanttDay {
  if (urlDate && isValid(parseISO(urlDate))) return urlDate;
  return format(new Date(), "yyyy-MM-dd");
}

/** Bornes de navigation du Gantt à partir des dates officielles du festival. */
export function ganttFestivalDayRange(
  startDate: string,
  endDate: string,
): { min: GanttDay; max: GanttDay } {
  return { min: startDate, max: endDate };
}

export interface GanttDayTimeRange {
  minTime: number;
  maxTime: number;
  hourLabels: string[];
}

const HOUR_MS = 60 * 60 * 1000;
const MIN_SPAN_MS = 6 * HOUR_MS;
const MARGIN_MS = 30 * 60 * 1000;

function buildHourLabels(minTime: number, maxTime: number): string[] {
  const span = maxTime - minTime;
  const stepHours = span > 14 * HOUR_MS ? 2 : 1;
  const labels: string[] = [];
  let t = minTime;
  while (t <= maxTime) {
    labels.push(format(new Date(t), "HH'h'"));
    t += stepHours * HOUR_MS;
  }
  return labels;
}

/** Plage horaire d'une journée, basée sur les créneaux visibles avec marge. */
export function computeDayTimeRange(
  rows: GanttRow[],
  day: GanttDay,
): GanttDayTimeRange {
  const allSlots = rows.flatMap((r) => r.slots);
  const { start: dayStart, end: dayEnd } = dayBounds(day);

  if (allSlots.length === 0) {
    const minTime = parseISO(`${day}T08:00:00`).getTime();
    const maxTime = addDays(startOfDay(parseISO(day)), 1).getTime() - 1;
    return { minTime, maxTime, hourLabels: buildHourLabels(minTime, maxTime) };
  }

  const times = allSlots.flatMap((s) => [
    parseISO(s.startAt).getTime(),
    parseISO(s.endAt).getTime(),
  ]);
  let min = Math.min(...times) - MARGIN_MS;
  let max = Math.max(...times) + MARGIN_MS;

  min = Math.floor(min / HOUR_MS) * HOUR_MS;
  max = Math.ceil(max / HOUR_MS) * HOUR_MS;

  if (max - min < MIN_SPAN_MS) {
    const mid = (min + max) / 2;
    min = mid - MIN_SPAN_MS / 2;
    max = mid + MIN_SPAN_MS / 2;
  }

  min = Math.max(min, dayStart.getTime());
  max = Math.min(max, dayEnd.getTime());

  return { minTime: min, maxTime: max, hourLabels: buildHourLabels(min, max) };
}

export function ganttDayRange(days: GanttDay[]): { min: GanttDay; max: GanttDay } | null {
  if (days.length === 0) return null;
  const sorted = [...days].sort();
  return { min: sorted[0]!, max: sorted[sorted.length - 1]! };
}

export function shiftGanttDay(day: GanttDay, delta: number): GanttDay {
  return format(addDays(parseISO(day), delta), "yyyy-MM-dd");
}

import type { Animation, Location, Slot, Task } from "@/lib/db/schema";
import {
  formatVolunteers,
  type VolunteerWithUser,
} from "@/lib/volunteer-display";

export interface LocationActivity {
  id: string;
  name: string;
  type: Location["type"];
  description: string | null;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  status: LocationStatus;
  currentEvent: { type: string; title: string; endAt: string } | null;
  nextEvent: { type: string; title: string; startAt: string } | null;
  activeVolunteers: string[];
  events: Array<{
    type: "animation" | "task" | "slot";
    title: string;
    startAt: string;
    endAt: string;
    people: string[];
  }>;
}

export type LocationStatus = "active" | "upcoming" | "idle";

type AnimationWithRelations = Animation & {
  artist?: { name: string } | null;
  volunteers?: VolunteerWithUser[];
};

type TaskWithVolunteers = Task & {
  volunteers?: VolunteerWithUser[];
};

type SlotWithRelations = Slot & {
  volunteers?: VolunteerWithUser[];
  post?: { title: string; locationId: string } | null;
};

export function getLocationActivity(
  loc: Location,
  animations: AnimationWithRelations[],
  tasks: TaskWithVolunteers[],
  slots: SlotWithRelations[],
  now: Date,
): LocationActivity {
  const locAnimations = animations.filter((a) => a.locationId === loc.id);
  const locTasks = tasks.filter((t) => t.locationId === loc.id);
  const locSlots = slots.filter((s) => s.post?.locationId === loc.id);

  const events: LocationActivity["events"] = [];

  for (const a of locAnimations) {
    const people: string[] = [];
    if (a.artist?.name) people.push(a.artist.name);
    people.push(...formatVolunteers(a.volunteers));
    events.push({
      type: "animation",
      title: a.title,
      startAt: a.startAt,
      endAt: a.endAt,
      people,
    });
  }

  for (const t of locTasks) {
    events.push({
      type: "task",
      title: t.title,
      startAt: t.startAt,
      endAt: t.endAt,
      people: formatVolunteers(t.volunteers),
    });
  }

  for (const s of locSlots) {
    events.push({
      type: "slot",
      title: s.post?.title || "Poste",
      startAt: s.startAt,
      endAt: s.endAt,
      people: formatVolunteers(s.volunteers),
    });
  }

  events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const nowMs = now.getTime();
  const twoHours = 2 * 60 * 60 * 1000;

  let currentEvent: LocationActivity["currentEvent"] = null;
  let nextEvent: LocationActivity["nextEvent"] = null;
  const activeVolunteers: string[] = [];

  for (const e of events) {
    const start = new Date(e.startAt).getTime();
    const end = new Date(e.endAt).getTime();
    if (start <= nowMs && end >= nowMs) {
      currentEvent = { type: e.type, title: e.title, endAt: e.endAt };
      activeVolunteers.push(...e.people);
    } else if (start > nowMs && start - nowMs <= twoHours && !nextEvent) {
      nextEvent = { type: e.type, title: e.title, startAt: e.startAt };
    }
  }

  let status: LocationStatus = "idle";
  if (currentEvent) status = "active";
  else if (nextEvent) status = "upcoming";

  return {
    id: loc.id,
    name: loc.name,
    type: loc.type,
    description: loc.description,
    gridX: loc.gridX,
    gridY: loc.gridY,
    gridW: loc.gridW,
    gridH: loc.gridH,
    status,
    currentEvent,
    nextEvent,
    activeVolunteers: [...new Set(activeVolunteers)],
    events,
  };
}

export function getVolunteerEvents(
  userId: string,
  animations: AnimationWithRelations[],
  tasks: TaskWithVolunteers[],
  slots: SlotWithRelations[],
) {
  const events: Array<{
    id: string;
    type: "animation" | "task" | "slot";
    title: string;
    startAt: string;
    endAt: string;
    location?: string;
    role?: string | null;
    isActive: boolean;
    isPast: boolean;
  }> = [];

  const now = Date.now();

  for (const a of animations) {
    const assignment = a.volunteers?.find((v) => v.userId === userId);
    if (!assignment) continue;
    const start = new Date(a.startAt).getTime();
    const end = new Date(a.endAt).getTime();
    events.push({
      id: a.id,
      type: "animation",
      title: a.title,
      startAt: a.startAt,
      endAt: a.endAt,
      role: assignment.role,
      isActive: start <= now && end >= now,
      isPast: end < now,
    });
  }

  for (const t of tasks) {
    const assignment = t.volunteers?.find((v) => v.userId === userId);
    if (!assignment) continue;
    const start = new Date(t.startAt).getTime();
    const end = new Date(t.endAt).getTime();
    events.push({
      id: t.id,
      type: "task",
      title: t.title,
      startAt: t.startAt,
      endAt: t.endAt,
      role: assignment.role,
      isActive: start <= now && end >= now,
      isPast: end < now,
    });
  }

  for (const s of slots) {
    const assignment = s.volunteers?.find((v) => v.userId === userId);
    if (!assignment) continue;
    const start = new Date(s.startAt).getTime();
    const end = new Date(s.endAt).getTime();
    events.push({
      id: s.id,
      type: "slot",
      title: s.post?.title || "Poste",
      startAt: s.startAt,
      endAt: s.endAt,
      role: assignment.role,
      isActive: start <= now && end >= now,
      isPast: end < now,
    });
  }

  events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return events;
}

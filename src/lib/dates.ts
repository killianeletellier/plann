import { parseISO } from "date-fns";

/** Jours de la semaine (lundi en premier), valeurs compatibles avec Date.getDay(). */
export const WEEK_DAYS = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mer", value: 3 },
  { label: "Jeu", value: 4 },
  { label: "Ven", value: 5 },
  { label: "Sam", value: 6 },
  { label: "Dim", value: 0 },
] as const;

/** Index du jour selon WEEK_DAYS (lundi=0 … dimanche=6). */
const DAY_INDEX: Map<number, number> = new Map(
  WEEK_DAYS.map((d, i) => [d.value, i]),
);

/** Compare deux créneaux : date calendaire, puis jour (lundi en premier), puis heure de début. */
export function compareSlotsChronologically(
  a: { startAt: string },
  b: { startAt: string },
): number {
  const startA = parseISO(a.startAt);
  const startB = parseISO(b.startAt);

  const dateCmp = startA.toISOString().slice(0, 10).localeCompare(
    startB.toISOString().slice(0, 10),
  );
  if (dateCmp !== 0) return dateCmp;

  const dayA = DAY_INDEX.get(startA.getDay()) ?? 0;
  const dayB = DAY_INDEX.get(startB.getDay()) ?? 0;
  if (dayA !== dayB) return dayA - dayB;

  return startA.getTime() - startB.getTime();
}

export function sortSlotsChronologically<T extends { startAt: string }>(slots: T[]): T[] {
  return [...slots].sort(compareSlotsChronologically);
}

export function withSortedSlots<T extends { slots?: Array<{ startAt: string }> }>(post: T): T {
  if (!post.slots?.length) return post;
  return { ...post, slots: sortSlotsChronologically(post.slots) };
}

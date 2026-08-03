export function hasNoVolunteers(volunteers?: unknown[] | null): boolean {
  return !volunteers || volunteers.length === 0;
}

export function isAnimationUnassigned(
  volunteers?: unknown[] | null,
  artistId?: string | null,
): boolean {
  return hasNoVolunteers(volunteers) && !artistId;
}

export function isTaskUnassigned(volunteers?: unknown[] | null): boolean {
  return hasNoVolunteers(volunteers);
}

export function isSlotUnassigned(volunteers?: unknown[] | null): boolean {
  return hasNoVolunteers(volunteers);
}

export const UNASSIGNED_HIGHLIGHT_CLASS =
  "border-amber-300 bg-amber-50";

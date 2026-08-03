export type FilterMode = "location" | "volunteer";

export interface PlanningEvent {
  id: string;
  type: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  locationId?: string;
  role?: string | null;
  people?: string[];
  volunteerIds?: string[];
  isActive?: boolean;
  isPast?: boolean;
  unassigned?: boolean;
  overdue?: boolean;
}

export interface FilterItem {
  id: string;
  label: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: "default" | "scene" | "vente" | "info";
  };
}

export const locationTypeLabels: Record<string, string> = {
  scene: "Scène",
  point_de_vente: "Point de vente",
  autre: "Autre",
};

export const locationTypeBadgeVariant: Record<
  string,
  "default" | "scene" | "vente"
> = {
  scene: "scene",
  point_de_vente: "vente",
  autre: "default",
};

export function filterPlanningEvents(
  events: PlanningEvent[],
  mode: FilterMode,
  selectedIds: string[],
): PlanningEvent[] {
  if (selectedIds.length === 0) return events;

  if (mode === "location") {
    return events.filter(
      (e) => e.locationId && selectedIds.includes(e.locationId),
    );
  }

  return events.filter((e) =>
    e.volunteerIds?.some((id) => selectedIds.includes(id)),
  );
}

export function parseFilterIds(idsParam: string | null): string[] {
  if (!idsParam) return [];
  return idsParam.split(",").filter(Boolean);
}

export function buildFilterSearchParams(
  mode: FilterMode,
  selectedIds: string[],
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("mode", mode);
  if (selectedIds.length > 0) {
    params.set("ids", selectedIds.join(","));
  }
  return params;
}

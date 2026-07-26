"use client";

import { Suspense, useMemo } from "react";
import { EventList } from "@/components/planning/EventList";
import { FilterGrid } from "@/components/planning/FilterGrid";
import { PlanningSkeleton } from "@/components/ui/loading-skeleton";
import {
  filterPlanningEvents,
  locationTypeBadgeVariant,
  locationTypeLabels,
  type FilterItem,
  type PlanningEvent,
} from "@/components/planning/planning-filters";
import { usePlanningFilterParams } from "@/components/planning/usePlanningFilterParams";

interface Location {
  id: string;
  name: string;
  type: string;
}

interface VolunteerPlanningContentProps {
  events: PlanningEvent[];
  locations: Location[];
}

function VolunteerPlanningContent({
  events,
  locations,
}: VolunteerPlanningContentProps) {
  const { mode, selectedIds, toggleId, selectAll } = usePlanningFilterParams({
    allowVolunteerMode: false,
  });

  const filterItems: FilterItem[] = useMemo(
    () =>
      locations.map((loc) => ({
        id: loc.id,
        label: loc.name,
        badge: {
          text: locationTypeLabels[loc.type] ?? loc.type,
          variant: locationTypeBadgeVariant[loc.type] ?? "default",
        },
      })),
    [locations],
  );

  const filteredEvents = useMemo(
    () => filterPlanningEvents(events, mode, selectedIds),
    [events, mode, selectedIds],
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Mon planning</h2>

      {locations.length > 0 && (
        <FilterGrid
          mode="location"
          showModeToggle={false}
          items={filterItems}
          selectedIds={selectedIds}
          onToggle={toggleId}
          onSelectAll={selectAll}
        />
      )}

      <EventList
        events={filteredEvents}
        emptyMessage={
          events.length === 0
            ? "Aucun événement planifié"
            : "Aucun événement ne correspond aux filtres sélectionnés"
        }
      />
    </div>
  );
}

interface VolunteerPlanningViewProps {
  events: PlanningEvent[];
  locations: Location[];
}

export function VolunteerPlanningView({
  events,
  locations,
}: VolunteerPlanningViewProps) {
  return (
    <Suspense fallback={<PlanningSkeleton />}>
      <VolunteerPlanningContent events={events} locations={locations} />
    </Suspense>
  );
}

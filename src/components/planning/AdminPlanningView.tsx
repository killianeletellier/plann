"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { format, isPast, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState, PlanningSkeleton } from "@/components/ui/loading-skeleton";
import { FilterGrid } from "@/components/planning/FilterGrid";
import {
  filterPlanningEvents,
  locationTypeBadgeVariant,
  locationTypeLabels,
  type FilterItem,
  type PlanningEvent,
} from "@/components/planning/planning-filters";
import { usePlanningFilterParams } from "@/components/planning/usePlanningFilterParams";
import { STABLE_EVENT_LIST } from "@/lib/ui-stable";
import { formatVolunteers } from "@/lib/volunteer-display";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  animation: "Animation",
  task: "Tâche",
  slot: "Poste",
};

function AdminPlanningContent() {
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string; type: string }>
  >([]);
  const [volunteers, setVolunteers] = useState<
    Array<{ id: string; firstName: string; lastName: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);

  const { mode, selectedIds, setMode, toggleId, selectAll } =
    usePlanningFilterParams();

  useEffect(() => {
    async function load() {
      const [animRes, taskRes, slotRes, locRes, userRes] = await Promise.all([
        fetch("/api/animations"),
        fetch("/api/tasks"),
        fetch("/api/slots"),
        fetch("/api/locations"),
        fetch("/api/users"),
      ]);

      const animations = animRes.ok ? await animRes.json() : [];
      const tasks = taskRes.ok ? await taskRes.json() : [];
      const slots = slotRes.ok ? await slotRes.json() : [];
      const locs = locRes.ok ? await locRes.json() : [];
      const users = userRes.ok ? await userRes.json() : [];

      setLocations(locs);
      setVolunteers(users);

      const all: PlanningEvent[] = [];

      for (const a of animations) {
        const people: string[] = [];
        const volunteerIds: string[] = [];
        if (a.artist?.name) people.push(a.artist.name);
        for (const v of a.volunteers || []) {
          if (v.user) people.push(formatVolunteers([v])[0]);
          if (v.userId) volunteerIds.push(v.userId);
        }
        all.push({
          id: a.id,
          type: "animation",
          title: a.title,
          startAt: a.startAt,
          endAt: a.endAt,
          location: a.location?.name,
          locationId: a.locationId ?? a.location?.id,
          people,
          volunteerIds,
        });
      }

      for (const t of tasks) {
        const volunteerIds = (t.volunteers || [])
          .map((v: { userId: string }) => v.userId)
          .filter(Boolean);
        const people = formatVolunteers(t.volunteers);
        all.push({
          id: t.id,
          type: "task",
          title: t.title,
          startAt: t.startAt,
          endAt: t.endAt,
          location: t.location?.name,
          locationId: t.locationId ?? t.location?.id,
          people,
          volunteerIds,
        });
      }

      for (const s of slots) {
        const volunteerIds = (s.volunteers || [])
          .map((v: { userId: string }) => v.userId)
          .filter(Boolean);
        const people = formatVolunteers(s.volunteers);
        all.push({
          id: s.id,
          type: "slot",
          title: s.post?.title || "Poste",
          startAt: s.startAt,
          endAt: s.endAt,
          location: s.post?.location?.name,
          locationId: s.post?.locationId ?? s.post?.location?.id,
          people,
          volunteerIds,
        });
      }

      all.sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
      setEvents(all);
      setLoading(false);
    }
    load();
  }, []);

  const filterItems: FilterItem[] = useMemo(() => {
    if (mode === "location") {
      return locations.map((loc) => ({
        id: loc.id,
        label: loc.name,
        badge: {
          text: locationTypeLabels[loc.type] ?? loc.type,
          variant: locationTypeBadgeVariant[loc.type] ?? "default",
        },
      }));
    }
    return volunteers.map((v) => ({
      id: v.id,
      label: v.firstName,
      subtitle: v.lastName,
    }));
  }, [mode, locations, volunteers]);

  const filteredEvents = useMemo(() => {
    let result = filterPlanningEvents(events, mode, selectedIds);
    if (!showPastEvents) {
      result = result.filter((e) => !isPast(parseISO(e.endAt)));
    }
    return result;
  }, [events, mode, selectedIds, showPastEvents]);

  const grouped = filteredEvents.reduce<Record<string, PlanningEvent[]>>(
    (acc, e) => {
      const day = format(parseISO(e.startAt), "yyyy-MM-dd");
      if (!acc[day]) acc[day] = [];
      acc[day].push(e);
      return acc;
    },
    {},
  );

  if (loading) return <PlanningSkeleton />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Planning global</h2>

      <FilterGrid
        mode={mode}
        onModeChange={setMode}
        items={filterItems}
        selectedIds={selectedIds}
        onToggle={toggleId}
        onSelectAll={selectAll}
      />

      <div className="flex items-center gap-3">
        <Switch
          id="show-past-events"
          checked={showPastEvents}
          onCheckedChange={setShowPastEvents}
        />
        <Label htmlFor="show-past-events">Afficher les événements passés</Label>
      </div>

      <div className={cn(STABLE_EVENT_LIST)}>
        {Object.keys(grouped).length === 0 ? (
          <EmptyState
            message={
              events.length === 0
                ? "Aucun événement planifié"
                : "Aucun événement ne correspond aux filtres sélectionnés"
            }
          />
        ) : (
          Object.entries(grouped).map(([day, dayEvents]) => (
            <div key={day} className="mb-6">
              <h3 className="mb-3 font-medium capitalize text-zinc-800">
                {format(parseISO(day), "EEEE d MMMM yyyy", { locale: fr })}
              </h3>
              <div className="space-y-2">
                {dayEvents.map((e) => (
                  <Card
                    key={e.id}
                    className={cn(
                      "min-h-[5.5rem]",
                      showPastEvents && isPast(parseISO(e.endAt)) && "opacity-60",
                    )}
                  >
                    <CardHeader className="py-3">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>{e.title}</span>
                        <Badge variant="info">{typeLabels[e.type]}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 text-sm text-zinc-600">
                      <p>
                        {format(parseISO(e.startAt), "HH:mm")} —{" "}
                        {format(parseISO(e.endAt), "HH:mm")}
                        {e.location && ` · ${e.location}`}
                      </p>
                      <p className="mt-1 min-h-[1.25rem]">
                        {e.people && e.people.length > 0 ? e.people.join(", ") : "\u00A0"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminPlanningView() {
  return (
    <Suspense fallback={<PlanningSkeleton />}>
      <AdminPlanningContent />
    </Suspense>
  );
}

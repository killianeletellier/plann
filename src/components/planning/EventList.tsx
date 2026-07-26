"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/loading-skeleton";
import {
  type PlanningEvent,
} from "@/components/planning/planning-filters";
import { STABLE_EVENT_LIST } from "@/lib/ui-stable";
import { cn } from "@/lib/utils";

interface EventListProps {
  events: PlanningEvent[];
  emptyMessage?: string;
}

export function EventList({ events, emptyMessage = "Aucun événement" }: EventListProps) {
  if (events.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const grouped = events.reduce<Record<string, PlanningEvent[]>>((acc, e) => {
    const day = format(parseISO(e.startAt), "yyyy-MM-dd");
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});

  return (
    <div className={cn(STABLE_EVENT_LIST, "space-y-6")}>
      {Object.entries(grouped).map(([day, dayEvents]) => (
        <div key={day}>
          <h3 className="font-semibold text-zinc-800 mb-3 capitalize">
            {format(parseISO(day), "EEEE d MMMM", { locale: fr })}
          </h3>
          <div className="space-y-3">
            {dayEvents.map((e) => (
              <Card
                key={e.id}
                className={cn(
                  "min-h-[5.5rem]",
                  e.isActive ? "border-green-400 bg-green-50" : e.isPast ? "opacity-60" : "",
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span>{e.title}</span>
                    <div className="flex shrink-0 gap-2">
                      <span className="min-w-[4.5rem]">
                        {e.isActive ? <Badge variant="success">En cours</Badge> : null}
                      </span>
                      {e.role ? <Badge variant="info">{e.role}</Badge> : null}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600">
                  <p>
                    {format(parseISO(e.startAt), "HH:mm", { locale: fr })} —{" "}
                    {format(parseISO(e.endAt), "HH:mm", { locale: fr })}
                  </p>
                  <p className="mt-1 min-h-[1.25rem]">{e.location || "\u00A0"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

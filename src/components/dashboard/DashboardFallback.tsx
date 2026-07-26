"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationDetailModal } from "./LocationDetailModal";
import type { LocationActivity } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface DashboardFallbackProps {
  locations: LocationActivity[];
}

const statusOrder = { active: 0, upcoming: 1, idle: 2 };

export function DashboardFallback({ locations }: DashboardFallbackProps) {
  const [selected, setSelected] = useState<LocationActivity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const sorted = [...locations].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status],
  );

  return (
    <>
      <div className="md:hidden space-y-3">
        {sorted.map((loc) => (
          <Card
            key={loc.id}
            className={cn(
              "cursor-pointer active:scale-[0.98] transition-transform",
              loc.status === "active" && "border-green-400",
              loc.status === "upcoming" && "border-orange-300",
            )}
            onClick={() => {
              setSelected(loc);
              setModalOpen(true);
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                {loc.name}
                {loc.status === "active" && <Badge variant="success">En cours</Badge>}
                {loc.status === "upcoming" && <Badge variant="warning">À venir</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600">
              {loc.currentEvent && <p>● {loc.currentEvent.title}</p>}
              {loc.nextEvent && (
                <p>
                  Prochain : {loc.nextEvent.title} à{" "}
                  {format(parseISO(loc.nextEvent.startAt), "HH:mm", { locale: fr })}
                </p>
              )}
              {!loc.currentEvent && !loc.nextEvent && <p>Aucune activité prévue</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <LocationDetailModal
        location={selected}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}

"use client";

import { format, isPast, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { LocationActivity } from "@/lib/dashboard";

interface LocationDetailModalProps {
  location: LocationActivity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeLabels: Record<string, string> = {
  scene: "Scène",
  point_de_vente: "Point de vente",
  autre: "Autre",
};

const eventTypeLabels: Record<string, string> = {
  animation: "Animation",
  task: "Tâche",
  slot: "Poste",
};

export function LocationDetailModal({
  location,
  open,
  onOpenChange,
}: LocationDetailModalProps) {
  if (!location) return null;

  const upcomingEvents = location.events.filter(
    (e) => !isPast(parseISO(e.endAt)),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="shrink-0 border-b border-zinc-200 px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            {location.name}
            <Badge variant="default">{typeLabels[location.type]}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {location.description && (
            <p className="text-sm text-zinc-600">{location.description}</p>
          )}
          <div className="space-y-3 mt-2">
            <h4 className="font-medium text-sm text-zinc-800">Événements</h4>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-zinc-500 min-h-[3rem]">Aucun événement planifié</p>
            ) : (
              upcomingEvents.map((e, i) => (
                <div key={i} className="rounded-lg border border-zinc-200 p-3 text-sm min-h-[4.5rem]">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{e.title}</span>
                    <Badge variant="info">{eventTypeLabels[e.type]}</Badge>
                  </div>
                  <p className="text-zinc-500 mt-1">
                    {format(parseISO(e.startAt), "dd/MM HH:mm", { locale: fr })} —{" "}
                    {format(parseISO(e.endAt), "HH:mm", { locale: fr })}
                  </p>
                  <p className="text-zinc-600 mt-1 min-h-[1.25rem]">
                    {e.people.length > 0 ? e.people.join(", ") : "\u00A0"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

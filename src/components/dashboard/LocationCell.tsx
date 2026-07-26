"use client";

import { forwardRef } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { GripVertical, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LocationActivity } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  scene: "Scène",
  point_de_vente: "Point de vente",
  autre: "Autre",
};

const statusStyles: Record<string, string> = {
  active: "border-green-500 bg-green-50",
  upcoming: "border-orange-400 bg-orange-50",
  idle: "border-zinc-200 bg-white",
};

interface LocationCellProps {
  location: LocationActivity;
  onClick?: () => void;
  style?: React.CSSProperties;
  editMode?: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
  isSaving?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  resizeHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  className?: string;
}

export const LocationCell = forwardRef<HTMLDivElement, LocationCellProps>(
  function LocationCell(
    {
      location,
      onClick,
      style,
      editMode = false,
      isDragging = false,
      isOverlay = false,
      isSaving = false,
      dragHandleProps,
      resizeHandleProps,
      className,
    },
    ref,
  ) {
    const interactive = !editMode && !!onClick;

    return (
      <div
        ref={ref}
        data-location-id={location.id}
        style={style}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? onClick : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        className={cn(
          "relative flex flex-col rounded-lg border-2 p-3 text-left transition-shadow min-h-[80px] touch-none select-none",
          statusStyles[location.status],
          interactive && "cursor-pointer hover:shadow-md",
          editMode && "ring-2 ring-blue-300 ring-offset-1",
          isDragging && !isOverlay && "opacity-40",
          isOverlay && "shadow-xl ring-2 ring-blue-500 scale-[1.02] z-50",
          isSaving && "opacity-70",
          className,
        )}
      >
        {editMode && (
          <button
            type="button"
            aria-label={`Déplacer ${location.name}`}
            title="Glisser pour déplacer"
            className="absolute left-1 top-1 z-10 flex h-8 w-8 touch-none items-center justify-center rounded-md bg-white/90 text-zinc-500 shadow-sm active:bg-blue-50 active:text-blue-600 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        <div
          className={cn(
            "flex flex-col",
            editMode && "pl-7 [@media(pointer:coarse)]:pl-12",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-sm text-zinc-900">{location.name}</span>
            <Badge
              variant={
                location.type === "scene"
                  ? "scene"
                  : location.type === "point_de_vente"
                    ? "vente"
                    : "default"
              }
            >
              {typeLabels[location.type]}
            </Badge>
          </div>
          {location.currentEvent && (
            <p className="mt-2 text-xs text-green-700 font-medium">
              ● {location.currentEvent.title}
            </p>
          )}
          {!location.currentEvent && location.nextEvent && (
            <p className="mt-2 text-xs text-orange-700">
              ○ {location.nextEvent.title} —{" "}
              {format(parseISO(location.nextEvent.startAt), "HH:mm", { locale: fr })}
            </p>
          )}
          {location.activeVolunteers.length > 0 && (
            <p className="mt-1 text-xs text-zinc-500 truncate">
              {location.activeVolunteers.join(", ")}
            </p>
          )}
        </div>

        {editMode && (
          <button
            type="button"
            aria-label={`Redimensionner ${location.name}`}
            title="Glisser pour redimensionner"
            className="absolute bottom-1 right-1 z-10 flex h-8 w-8 touch-none items-center justify-center rounded-md bg-white/90 text-zinc-500 shadow-sm active:bg-blue-50 active:text-blue-600 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11"
            {...resizeHandleProps}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  },
);

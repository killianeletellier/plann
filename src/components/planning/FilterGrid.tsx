"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STABLE_GRID_CELL } from "@/lib/ui-stable";
import type { FilterItem, FilterMode } from "./planning-filters";

interface FilterGridProps {
  mode: FilterMode;
  onModeChange?: (mode: FilterMode) => void;
  showModeToggle?: boolean;
  items: FilterItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
}

export function FilterGrid({
  mode,
  onModeChange,
  showModeToggle = true,
  items,
  selectedIds,
  onToggle,
  onSelectAll,
}: FilterGridProps) {
  const allSelected = selectedIds.length === 0;

  return (
    <div className="space-y-4">
      {showModeToggle && onModeChange && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onModeChange("location")}
            className={cn(
              "min-h-11 rounded-lg border px-4 py-3 text-base font-medium transition-colors",
              mode === "location"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
            )}
          >
            Par lieu
          </button>
          <button
            type="button"
            onClick={() => onModeChange("volunteer")}
            className={cn(
              "min-h-11 rounded-lg border px-4 py-3 text-base font-medium transition-colors",
              mode === "volunteer"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
            )}
          >
            Par bénévole
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <button
          type="button"
          onClick={onSelectAll}
          className={cn(
            "col-span-2 flex flex-col items-center justify-center rounded-lg border-2 px-3 py-3 text-center transition-colors sm:col-span-1",
            STABLE_GRID_CELL,
            allSelected
              ? "border-zinc-900 bg-zinc-100 font-semibold text-zinc-900"
              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
          )}
        >
          Tous
        </button>

        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={cn(
                "rounded-lg border-2 px-3 py-3 text-left transition-colors",
                STABLE_GRID_CELL,
                isSelected
                  ? "border-zinc-900 bg-zinc-100"
                  : "border-zinc-200 bg-white hover:bg-zinc-50",
              )}
            >
              <span className="text-sm font-medium leading-tight text-zinc-900 line-clamp-2">
                {item.label}
              </span>
              <span className="mt-0.5 block min-h-[1rem] text-xs text-zinc-500">
                {item.subtitle ?? "\u00A0"}
              </span>
              <span className="mt-1.5 block min-h-[1.375rem]">
                {item.badge ? (
                  <Badge variant={item.badge.variant ?? "default"}>{item.badge.text}</Badge>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

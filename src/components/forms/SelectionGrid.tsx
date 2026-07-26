"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STABLE_GRID_CELL } from "@/lib/ui-stable";

export interface SelectionItem {
  id: string;
  label: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: "default" | "scene" | "vente" | "info";
  };
}

export interface SelectionGridProps {
  mode: "single" | "multiple";
  items: SelectionItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyLabel?: string;
  className?: string;
}

function handleToggle(
  mode: "single" | "multiple",
  id: string,
  selectedIds: string[],
  onChange: (ids: string[]) => void,
) {
  if (mode === "single") {
    if (selectedIds.includes(id)) {
      onChange([]);
    } else {
      onChange([id]);
    }
    return;
  }

  if (selectedIds.includes(id)) {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  } else {
    onChange([...selectedIds, id]);
  }
}

export function SelectionGrid({
  mode,
  items,
  selectedIds,
  onChange,
  emptyLabel,
  className,
}: SelectionGridProps) {
  const noneSelected = selectedIds.length === 0;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        className,
      )}
    >
      {mode === "single" && emptyLabel && (
        <button
          type="button"
          onClick={() => onChange([])}
          className={cn(
            "col-span-2 flex flex-col items-center justify-center rounded-lg border-2 px-3 py-3 text-center transition-colors sm:col-span-1",
            STABLE_GRID_CELL,
            noneSelected
              ? "border-zinc-900 bg-zinc-100 font-semibold text-zinc-900"
              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
          )}
        >
          {emptyLabel}
        </button>
      )}

      {items.map((item) => {
        const isSelected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleToggle(mode, item.id, selectedIds, onChange)}
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
  );
}

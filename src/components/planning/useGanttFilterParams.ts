"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  GANTT_VIEW_MODES,
  type GanttDay,
  type GanttViewMode,
} from "@/lib/gantt-data";
import { parseFilterIds } from "./planning-filters";

function buildGanttSearchParams(
  mode: GanttViewMode,
  selectedIds: string[],
  date?: GanttDay | null,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("mode", mode);
  if (selectedIds.length > 0) {
    params.set("ids", selectedIds.join(","));
  }
  if (date) {
    params.set("date", date);
  }
  return params;
}

export function useGanttFilterParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const mode: GanttViewMode = useMemo(() => {
    const param = searchParams.get("mode");
    if (param && GANTT_VIEW_MODES.includes(param as GanttViewMode)) {
      return param as GanttViewMode;
    }
    return "location";
  }, [searchParams]);

  const selectedIds = useMemo(
    () => parseFilterIds(searchParams.get("ids")),
    [searchParams],
  );

  const date = useMemo(
    () => searchParams.get("date"),
    [searchParams],
  );

  const replaceParams = useCallback(
    (nextMode: GanttViewMode, nextIds: string[], nextDate?: GanttDay | null) => {
      const params = buildGanttSearchParams(nextMode, nextIds, nextDate ?? date);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, date],
  );

  const setMode = useCallback(
    (newMode: GanttViewMode) => {
      replaceParams(newMode, []);
    },
    [replaceParams],
  );

  const toggleId = useCallback(
    (id: string) => {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id];
      replaceParams(mode, next);
    },
    [replaceParams, mode, selectedIds],
  );

  const selectAll = useCallback(() => {
    replaceParams(mode, []);
  }, [replaceParams, mode]);

  const setDate = useCallback(
    (newDate: GanttDay) => {
      replaceParams(mode, selectedIds, newDate);
    },
    [replaceParams, mode, selectedIds],
  );

  return { mode, selectedIds, date, setMode, toggleId, selectAll, setDate };
}

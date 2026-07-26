"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildFilterSearchParams,
  type FilterMode,
  parseFilterIds,
} from "./planning-filters";

interface UsePlanningFilterParamsOptions {
  allowVolunteerMode?: boolean;
}

export function usePlanningFilterParams(
  options: UsePlanningFilterParamsOptions = {},
) {
  const { allowVolunteerMode = true } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const mode: FilterMode = useMemo(() => {
    const param = searchParams.get("mode");
    if (param === "volunteer" && allowVolunteerMode) return "volunteer";
    return "location";
  }, [searchParams, allowVolunteerMode]);

  const selectedIds = useMemo(
    () => parseFilterIds(searchParams.get("ids")),
    [searchParams],
  );

  const setMode = useCallback(
    (newMode: FilterMode) => {
      const params = buildFilterSearchParams(newMode, selectedIds);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, selectedIds],
  );

  const toggleId = useCallback(
    (id: string) => {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id];
      const params = buildFilterSearchParams(mode, next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, mode, selectedIds],
  );

  const selectAll = useCallback(() => {
    const params = buildFilterSearchParams(mode, []);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, mode]);

  return { mode, selectedIds, setMode, toggleId, selectAll };
}

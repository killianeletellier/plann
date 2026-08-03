"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { FilterGrid } from "@/components/planning/FilterGrid";
import { GanttView } from "@/components/planning/GanttView";
import { useGanttFilterParams } from "@/components/planning/useGanttFilterParams";
import { Button } from "@/components/ui/button";
import { EmptyState, PlanningSkeleton } from "@/components/ui/loading-skeleton";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast-provider";
import {
  buildLocationGanttRows,
  buildSceneGanttRows,
  buildVolunteerGanttRows,
  filterGanttRowsByDay,
  formatGanttDayShort,
  ganttFestivalDayRange,
  ganttFilterItems,
  ganttModeLabels,
  GANTT_VIEW_MODES,
  resolveDefaultGanttDay,
  shiftGanttDay,
  type GanttDay,
  type GanttRow,
  type GanttViewMode,
} from "@/lib/gantt-data";
import {
  downloadGanttPdf,
  ganttRowsHaveSlots,
} from "@/lib/pdf/gantt-export";
import { STABLE_BUTTON } from "@/lib/ui-stable";
import type { TaskStatus } from "@/lib/task-status";
import { cn } from "@/lib/utils";

function GanttModeToggle({
  mode,
  onModeChange,
}: {
  mode: GanttViewMode;
  onModeChange: (mode: GanttViewMode) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {GANTT_VIEW_MODES.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onModeChange(m)}
          className={cn(
            "min-h-11 rounded-lg border px-3 py-3 text-sm font-medium transition-colors sm:text-base",
            mode === m
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
          )}
        >
          {ganttModeLabels[m]}
        </button>
      ))}
    </div>
  );
}

function GanttDaySelector({
  day,
  minDay,
  maxDay,
  onDayChange,
}: {
  day: GanttDay;
  minDay: GanttDay | null;
  maxDay: GanttDay | null;
  onDayChange: (day: GanttDay) => void;
}) {
  const canGoPrev = !minDay || day > minDay;
  const canGoNext = !maxDay || day < maxDay;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onDayChange(shiftGanttDay(day, -1))}
        disabled={!canGoPrev}
        aria-label="Jour précédent"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Input
        type="date"
        value={day}
        min={minDay ?? undefined}
        max={maxDay ?? undefined}
        onChange={(e) => {
          if (e.target.value) onDayChange(e.target.value);
        }}
        className="w-auto min-w-[10.5rem]"
        aria-label="Date du Gantt"
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onDayChange(shiftGanttDay(day, 1))}
        disabled={!canGoNext}
        aria-label="Jour suivant"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <span className="text-sm text-zinc-600 capitalize">
        {formatGanttDayShort(day)}
      </span>
    </div>
  );
}

function AdminGanttContent() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [posts, setPosts] = useState<
    Array<{
      id: string;
      title: string;
      locationId: string;
      location?: { name: string } | null;
      slots?: Array<{
        id: string;
        startAt: string;
        endAt: string;
        volunteers?: Array<{
          userId: string;
          user?: { firstName: string; lastName: string } | null;
        }>;
      }>;
    }>
  >([]);
  const [slots, setSlots] = useState<
    Array<{
      id: string;
      startAt: string;
      endAt: string;
      postId: string;
      post?: {
        title: string;
        locationId: string;
        location?: { id: string; name: string } | null;
      } | null;
      volunteers?: Array<{ userId: string }>;
    }>
  >([]);
  const [animations, setAnimations] = useState<
    Array<{
      id: string;
      title: string;
      startAt: string;
      endAt: string;
      locationId: string;
      artistId?: string | null;
      artist?: { name: string } | null;
      location?: { id: string; name: string } | null;
      volunteers?: Array<{
        userId: string;
        user?: { firstName: string; lastName: string } | null;
      }>;
    }>
  >([]);
  const [tasks, setTasks] = useState<
    Array<{
      id: string;
      title: string;
      startAt: string;
      endAt: string;
      status?: TaskStatus;
      locationId?: string | null;
      location?: { id: string; name: string } | null;
      volunteers?: Array<{
        userId: string;
        user?: { firstName: string; lastName: string } | null;
      }>;
    }>
  >([]);
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string; type: string }>
  >([]);
  const [volunteers, setVolunteers] = useState<
    Array<{ id: string; firstName: string; lastName: string }>
  >([]);
  const [festivalDates, setFestivalDates] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const { mode, selectedIds, date, setMode, toggleId, selectAll, setDate } =
    useGanttFilterParams();

  useEffect(() => {
    async function load() {
      const [postRes, slotRes, animRes, taskRes, locRes, userRes, festivalRes] =
        await Promise.all([
          fetch("/api/posts"),
          fetch("/api/slots"),
          fetch("/api/animations"),
          fetch("/api/tasks"),
          fetch("/api/locations"),
          fetch("/api/users"),
          fetch("/api/festival"),
        ]);

      if (postRes.ok) setPosts(await postRes.json());
      if (slotRes.ok) setSlots(await slotRes.json());
      if (animRes.ok) setAnimations(await animRes.json());
      if (taskRes.ok) setTasks(await taskRes.json());
      if (locRes.ok) setLocations(await locRes.json());
      if (userRes.ok) setVolunteers(await userRes.json());
      if (festivalRes.ok) {
        const festival = await festivalRes.json();
        setFestivalDates({
          startDate: festival.startDate,
          endDate: festival.endDate,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const dayRange = useMemo(
    () =>
      festivalDates
        ? ganttFestivalDayRange(festivalDates.startDate, festivalDates.endDate)
        : null,
    [festivalDates],
  );

  const effectiveDay = useMemo(
    () => resolveDefaultGanttDay(date),
    [date],
  );

  useEffect(() => {
    if (!loading && effectiveDay !== date) {
      setDate(effectiveDay);
    }
  }, [loading, effectiveDay, date, setDate]);

  const filterItems = useMemo(
    () => ganttFilterItems(mode, locations, volunteers),
    [mode, locations, volunteers],
  );

  const rows: GanttRow[] = useMemo(() => {
    const targetIds =
      selectedIds.length > 0 ? selectedIds : [];

    if (targetIds.length === 0) return [];

    const allRows: GanttRow[] = [];

    for (const id of targetIds) {
      if (mode === "location") {
        allRows.push(
          ...buildLocationGanttRows(id, posts, animations, tasks),
        );
      } else if (mode === "volunteer") {
        allRows.push(
          ...buildVolunteerGanttRows(id, slots, animations, tasks, locations),
        );
      } else {
        allRows.push(...buildSceneGanttRows(id, animations));
      }
    }

    return allRows;
  }, [mode, selectedIds, posts, slots, animations, tasks, locations]);

  const dayRows = useMemo(
    () => filterGanttRowsByDay(rows, effectiveDay),
    [rows, effectiveDay],
  );

  const showGroups = mode === "volunteer" && selectedIds.length === 1;
  const canExport =
    selectedIds.length > 0 && ganttRowsHaveSlots(dayRows);

  const selectedLabels = useMemo(() => {
    const labelById = new Map(filterItems.map((item) => [item.id, item.label]));
    return selectedIds
      .map((id) => labelById.get(id))
      .filter((label): label is string => Boolean(label));
  }, [filterItems, selectedIds]);

  async function handleExportPdf() {
    if (!canExport) return;
    setExporting(true);
    try {
      await downloadGanttPdf({
        mode,
        rows: dayRows,
        selectedLabels,
        day: effectiveDay,
        showGroups,
      });
      toast({ type: "success", message: "PDF Gantt téléchargé" });
    } catch {
      toast({ type: "error", message: "Erreur lors de l'export PDF" });
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <PlanningSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Vue Gantt</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Timeline journalière des postes, animations et tâches selon différentes perspectives.
        </p>
      </div>

      <GanttModeToggle mode={mode} onModeChange={setMode} />

      <GanttDaySelector
        day={effectiveDay}
        minDay={dayRange?.min ?? null}
        maxDay={dayRange?.max ?? null}
        onDayChange={setDate}
      />

      <FilterGrid
        mode={mode === "volunteer" ? "volunteer" : "location"}
        showModeToggle={false}
        items={filterItems}
        selectedIds={selectedIds}
        onToggle={toggleId}
        onSelectAll={selectAll}
      />

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        {selectedIds.length === 0 ? (
          <EmptyState message="Sélectionnez un élément ci-dessus pour afficher la timeline." />
        ) : (
          <div className="space-y-4">
            {canExport && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportPdf}
                  disabled={exporting}
                  className={cn(STABLE_BUTTON)}
                  aria-busy={exporting}
                >
                  {exporting ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Exporter PDF
                    </>
                  )}
                </Button>
              </div>
            )}
            <GanttView rows={dayRows} day={effectiveDay} showGroups={showGroups} />
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminGanttView() {
  return (
    <Suspense fallback={<PlanningSkeleton />}>
      <AdminGanttContent />
    </Suspense>
  );
}

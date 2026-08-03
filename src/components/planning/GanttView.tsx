"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  computeDayTimeRange,
  extractGanttLegend,
  formatGanttDayShort,
  ganttHasStatusIndicator,
  type GanttDay,
  type GanttRow,
  type GanttSlot,
} from "@/lib/gantt-data";
import {
  GANTT_OVERDUE_BORDER,
  GANTT_UNASSIGNED_BORDER,
} from "@/lib/mission-color";

export type { GanttRow, GanttSlot };

interface GanttViewProps {
  rows: GanttRow[];
  day: GanttDay;
  showGroups?: boolean;
}

function pct(time: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(100, ((time - min) / (max - min)) * 100));
}

function slotBorderStyle(slot: GanttSlot): React.CSSProperties | undefined {
  if (slot.overdue) {
    return { boxShadow: `inset 0 0 0 2px ${GANTT_OVERDUE_BORDER}` };
  }
  if (slot.unassigned) {
    return { boxShadow: `inset 0 0 0 2px ${GANTT_UNASSIGNED_BORDER}` };
  }
  return undefined;
}

export function GanttView({ rows, day, showGroups = false }: GanttViewProps) {
  const { minTime, maxTime, hourLabels } = useMemo(
    () => computeDayTimeRange(rows, day),
    [rows, day],
  );

  const legendItems = useMemo(() => extractGanttLegend(rows), [rows]);
  const hasUnassigned = useMemo(
    () => ganttHasStatusIndicator(rows, "unassigned"),
    [rows],
  );
  const hasOverdue = useMemo(
    () => ganttHasStatusIndicator(rows, "overdue"),
    [rows],
  );

  const hasSlots = rows.some((r) => r.slots.length > 0);

  const rowsWithHeaders = useMemo(() => {
    if (!showGroups) return rows.map((row) => ({ row, groupHeader: undefined as string | undefined }));

    let previousGroup: string | undefined;
    return rows.map((row) => {
      const groupHeader =
        row.group && row.group !== previousGroup ? row.group : undefined;
      if (groupHeader) previousGroup = row.group;
      return { row, groupHeader };
    });
  }, [rows, showGroups]);

  if (!hasSlots) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        Aucune mission ce jour-là
      </p>
    );
  }

  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 min-w-[600px] pl-40 pr-2">
        <span className="capitalize font-medium text-zinc-700">
          {formatGanttDayShort(day)}
        </span>
      </div>

      <div className="flex gap-2 text-xs text-zinc-500 min-w-[600px] pl-40">
        {hourLabels.map((label, i) => (
          <span key={`${label}-${i}`} className="flex-1 text-center">
            {label}
          </span>
        ))}
      </div>

      <div className="space-y-2 min-w-[600px]">
        {rowsWithHeaders.map(({ row, groupHeader }) => {
          if (row.slots.length === 0) return null;

          return (
            <div key={row.id}>
              {groupHeader && (
                <p className="mb-1 mt-3 first:mt-0 text-xs font-semibold uppercase tracking-wide text-zinc-500 pl-1">
                  {groupHeader}
                </p>
              )}
              <div className="flex items-center gap-3">
                <div className="w-36 shrink-0 text-sm">
                  <p className="font-medium truncate">{row.title}</p>
                  {row.subtitle && (
                    <p className="text-xs text-zinc-500 truncate">{row.subtitle}</p>
                  )}
                </div>
                <div className="relative flex-1 h-8 rounded bg-zinc-100">
                  {row.slots.map((slot) => {
                    const start = parseISO(slot.startAt).getTime();
                    const end = parseISO(slot.endAt).getTime();
                    const left = pct(start, minTime, maxTime);
                    const width = pct(end, minTime, maxTime) - left;
                    const timeRange = `${format(parseISO(slot.startAt), "HH:mm")} — ${format(parseISO(slot.endAt), "HH:mm")}`;

                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          "absolute top-1 bottom-1 rounded text-[10px] text-white flex items-center justify-center overflow-hidden px-1",
                        )}
                        style={{
                          left: `${left}%`,
                          width: `${Math.max(width, 1)}%`,
                          backgroundColor: slot.color,
                          ...slotBorderStyle(slot),
                        }}
                        title={
                          slot.label
                            ? `${slot.label} · ${timeRange}`
                            : timeRange
                        }
                      >
                        <span className="truncate">
                          {slot.label ??
                            format(parseISO(slot.startAt), "HH:mm")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
        {legendItems.map((item) => (
          <span key={item.id} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
        {hasUnassigned && (
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded border-2 bg-zinc-200"
              style={{ borderColor: GANTT_UNASSIGNED_BORDER }}
            />
            Sans bénévole
          </span>
        )}
        {hasOverdue && (
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded border-2 bg-zinc-200"
              style={{ borderColor: GANTT_OVERDUE_BORDER }}
            />
            En retard
          </span>
        )}
      </div>
    </div>
  );
}

/** @deprecated Utiliser GanttView — conservé pour compatibilité */
export function PostGanttView({
  posts,
  day,
}: {
  posts: Array<{
    id: string;
    title: string;
    color?: string;
    locationName?: string;
    slots: Array<{
      id: string;
      startAt: string;
      endAt: string;
      title?: string;
      unassigned?: boolean;
    }>;
  }>;
  day: GanttDay;
}) {
  const rows: GanttRow[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    subtitle: post.locationName,
    slots: post.slots.map((s) => ({
      id: s.id,
      startAt: s.startAt,
      endAt: s.endAt,
      kind: "slot",
      color: post.color ?? "#3B82F6",
      missionId: post.id,
      missionLabel: post.title,
      unassigned: s.unassigned,
    })),
  }));

  return <GanttView rows={rows} day={day} />;
}

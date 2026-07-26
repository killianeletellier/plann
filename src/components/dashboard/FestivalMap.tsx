"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Move, Pencil } from "lucide-react";
import { LocationCell } from "./LocationCell";
import { LocationDetailModal } from "./LocationDetailModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { STABLE_MAP_GRID } from "@/lib/ui-stable";
import {
  MAP_GRID_COLS,
  MAP_GRID_ROWS,
  clampGridRect,
  getCellSize,
  getGridMetrics,
  gridAreaStyle,
  gridPositionFromTranslatedRect,
  gridSizeFromPointerDelta,
  type GridRect,
} from "@/lib/map-grid";
import { cn } from "@/lib/utils";
import type { LocationActivity } from "@/lib/dashboard";

interface FestivalMapEditButtonProps {
  editMode: boolean;
  onEditModeChange: (editing: boolean) => void;
  className?: string;
}

export function FestivalMapEditButton({
  editMode,
  onEditModeChange,
  className,
}: FestivalMapEditButtonProps) {
  return (
    <Button
      type="button"
      variant={editMode ? "default" : "outline"}
      size="icon"
      className={cn(
        "hidden md:inline-flex h-9 w-9 p-0 shadow-sm",
        editMode ? "text-white" : "text-zinc-900",
        className,
      )}
      onClick={() => onEditModeChange(!editMode)}
      title={
        editMode
          ? "Quitter le mode édition"
          : "Modifier la carte — déplacer et redimensionner les lieux"
      }
      aria-label={
        editMode
          ? "Quitter le mode édition de la carte"
          : "Activer le mode édition de la carte"
      }
      aria-pressed={editMode}
    >
      {editMode ? (
        <Move className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
      )}
    </Button>
  );
}

interface FestivalMapProps {
  locations: LocationActivity[];
  editable?: boolean;
  editMode?: boolean;
  onLocationsChange?: (locations: LocationActivity[]) => void;
  onEditModeChange?: (editing: boolean) => void;
}

type GridOverrides = Record<string, GridRect>;

function mergeGrid(
  location: LocationActivity,
  overrides: GridOverrides,
): GridRect {
  const o = overrides[location.id];
  return clampGridRect({
    gridX: o?.gridX ?? location.gridX,
    gridY: o?.gridY ?? location.gridY,
    gridW: o?.gridW ?? location.gridW,
    gridH: o?.gridH ?? location.gridH,
  });
}

async function persistLocationGrid(
  location: LocationActivity,
  grid: GridRect,
): Promise<boolean> {
  const res = await fetch(`/api/locations/${location.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: location.name,
      type: location.type,
      description: location.description ?? "",
      ...grid,
    }),
  });
  return res.ok;
}

interface DraggableMapCellProps {
  location: LocationActivity;
  grid: GridRect;
  editMode: boolean;
  isDragging: boolean;
  isSaving: boolean;
  onClick?: () => void;
  onResizeStart: (
    locationId: string,
    startGrid: GridRect,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
}

function DraggableMapCell({
  location,
  grid,
  editMode,
  isDragging,
  isSaving,
  onClick,
  onResizeStart,
}: DraggableMapCellProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: location.id,
    disabled: !editMode,
  });

  const style = {
    ...gridAreaStyle(grid),
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <LocationCell
      ref={setNodeRef}
      location={location}
      onClick={onClick}
      style={style}
      editMode={editMode}
      isDragging={isDragging}
      isSaving={isSaving}
      dragHandleProps={editMode ? { ...attributes, ...listeners } : undefined}
      resizeHandleProps={
        editMode
          ? {
              onPointerDown: (e) => {
                e.stopPropagation();
                onResizeStart(location.id, grid, e);
              },
            }
          : undefined
      }
    />
  );
}

function EditModeGridOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${MAP_GRID_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${MAP_GRID_ROWS}, minmax(60px, 1fr))`,
      }}
      aria-hidden
    >
      {Array.from({ length: MAP_GRID_COLS * MAP_GRID_ROWS }).map((_, i) => (
        <div
          key={i}
          className="rounded border border-dashed border-zinc-300/70 bg-white/40"
        />
      ))}
    </div>
  );
}

function MapGrid({
  gridRef,
  editMode,
  locations,
  activeId,
  savingIds,
  getGridFor,
  onClick,
  onResizeStart,
}: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  editMode: boolean;
  locations: LocationActivity[];
  activeId: string | null;
  savingIds: Set<string>;
  getGridFor: (loc: LocationActivity) => GridRect;
  onClick: (loc: LocationActivity) => void;
  onResizeStart: DraggableMapCellProps["onResizeStart"];
}) {
  return (
    <div
      ref={gridRef}
      className={cn(STABLE_MAP_GRID, "relative grid")}
      style={{
        gridTemplateColumns: `repeat(${MAP_GRID_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${MAP_GRID_ROWS}, minmax(60px, 1fr))`,
      }}
    >
      {editMode && <EditModeGridOverlay />}

      {locations.map((loc) => {
        const grid = getGridFor(loc);
        if (editMode) {
          return (
            <DraggableMapCell
              key={loc.id}
              location={loc}
              grid={grid}
              editMode
              isDragging={activeId === loc.id}
              isSaving={savingIds.has(loc.id)}
              onClick={() => onClick(loc)}
              onResizeStart={onResizeStart}
            />
          );
        }
        return (
          <LocationCell
            key={loc.id}
            location={loc}
            onClick={() => onClick(loc)}
            style={gridAreaStyle(grid)}
          />
        );
      })}
    </div>
  );
}

export function FestivalMap({
  locations,
  editMode: controlledEditMode,
  onLocationsChange,
}: FestivalMapProps) {
  const { toast } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<LocationActivity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [internalEditMode] = useState(false);
  const isControlled = controlledEditMode !== undefined;
  const editMode = isControlled ? controlledEditMode : internalEditMode;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [gridOverrides, setGridOverrides] = useState<GridOverrides>({});
  const activeGridOverrides = useMemo(
    () => (editMode ? gridOverrides : {}),
    [editMode, gridOverrides],
  );
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const gridOverridesRef = useRef<GridOverrides>({});
  const resizeRef = useRef<{
    locationId: string;
    startGrid: GridRect;
    startX: number;
    startY: number;
    pointerId: number;
    target: HTMLButtonElement;
  } | null>(null);

  useEffect(() => {
    gridOverridesRef.current = activeGridOverrides;
  }, [activeGridOverrides]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const refreshOverlay = () => {
      if (!activeId) return;
      const loc = locations.find((l) => l.id === activeId);
      if (!loc) return;
      const g = mergeGrid(loc, gridOverridesRef.current);
      const { rect, gapPx } = getGridMetrics(grid);
      const { cellWidth, cellHeight } = getCellSize(rect, gapPx);
      setOverlaySize({
        width: g.gridW * cellWidth + (g.gridW - 1) * gapPx,
        height: g.gridH * cellHeight + (g.gridH - 1) * gapPx,
      });
    };

    const observer = new ResizeObserver(refreshOverlay);
    observer.observe(grid);

    const mq = window.matchMedia("(pointer: coarse)");
    const onLayoutChange = () => refreshOverlay();
    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("orientationchange", onLayoutChange);
    mq.addEventListener("change", onLayoutChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("orientationchange", onLayoutChange);
      mq.removeEventListener("change", onLayoutChange);
    };
  }, [activeId, locations]);

  useEffect(() => {
    if (!editMode) return;
    const mq = window.matchMedia("(pointer: coarse)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [editMode]);

  const getGridFor = useCallback(
    (loc: LocationActivity) => mergeGrid(loc, activeGridOverrides),
    [activeGridOverrides],
  );

  const applyAndSave = useCallback(
    async (location: LocationActivity, grid: GridRect) => {
      const clamped = clampGridRect(grid);
      setGridOverrides((prev) => ({ ...prev, [location.id]: clamped }));
      setSavingIds((prev) => new Set(prev).add(location.id));

      const ok = await persistLocationGrid(location, clamped);
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(location.id);
        return next;
      });

      if (ok) {
        onLocationsChange?.(
          locations.map((l) => (l.id === location.id ? { ...l, ...clamped } : l)),
        );
        toast({ type: "success", message: `Position de « ${location.name} » enregistrée` });
      } else {
        setGridOverrides((prev) => {
          const next = { ...prev };
          delete next[location.id];
          return next;
        });
        toast({ type: "error", message: "Erreur lors de l'enregistrement de la position" });
      }
    },
    [locations, onLocationsChange, toast],
  );

  const handleClick = (loc: LocationActivity) => {
    if (editMode) return;
    setSelected(loc);
    setModalOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);
    const loc = locations.find((l) => l.id === id);
    if (loc && gridRef.current) {
      const g = getGridFor(loc);
      const { rect, gapPx } = getGridMetrics(gridRef.current);
      const { cellWidth, cellHeight } = getCellSize(rect, gapPx);
      setOverlaySize({
        width: g.gridW * cellWidth + (g.gridW - 1) * gapPx,
        height: g.gridH * cellHeight + (g.gridH - 1) * gapPx,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setOverlaySize(null);
    if (!editMode || !gridRef.current) return;

    const { active } = event;
    const location = locations.find((l) => l.id === active.id);
    if (!location) return;

    const translated = active.rect.current.translated;
    if (!translated) return;

    const current = mergeGrid(location, gridOverridesRef.current);
    const { rect: gridRect, gapPx } = getGridMetrics(gridRef.current);
    const { gridX, gridY } = gridPositionFromTranslatedRect(
      translated,
      gridRect,
      current.gridW,
      current.gridH,
      gapPx,
    );

    if (gridX === current.gridX && gridY === current.gridY) return;
    void applyAndSave(location, { ...current, gridX, gridY });
  };

  const handleResizeStart = (
    locationId: string,
    startGrid: GridRect,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!editMode) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = {
      locationId,
      startGrid,
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
      target: event.currentTarget,
    };
  };

  useEffect(() => {
    if (!editMode) return;

    const handlePointerMove = (event: PointerEvent) => {
      const resize = resizeRef.current;
      if (!resize || !gridRef.current || event.pointerId !== resize.pointerId) return;
      event.preventDefault();

      const deltaX = event.clientX - resize.startX;
      const deltaY = event.clientY - resize.startY;
      const { rect: gridRect, gapPx } = getGridMetrics(gridRef.current);
      const { gridW, gridH } = gridSizeFromPointerDelta(
        resize.startGrid.gridW,
        resize.startGrid.gridH,
        resize.startGrid.gridX,
        resize.startGrid.gridY,
        deltaX,
        deltaY,
        gridRect,
        gapPx,
      );

      setGridOverrides((prev) => ({
        ...prev,
        [resize.locationId]: { ...resize.startGrid, gridW, gridH },
      }));
    };

    const finishResize = (event: PointerEvent) => {
      const resize = resizeRef.current;
      if (!resize || event.pointerId !== resize.pointerId) return;

      const location = locations.find((l) => l.id === resize.locationId);
      if (!location || !gridRef.current) {
        resizeRef.current = null;
        return;
      }

      const deltaX = event.clientX - resize.startX;
      const deltaY = event.clientY - resize.startY;
      const { rect: gridRect, gapPx } = getGridMetrics(gridRef.current);
      const { gridW, gridH } = gridSizeFromPointerDelta(
        resize.startGrid.gridW,
        resize.startGrid.gridH,
        resize.startGrid.gridX,
        resize.startGrid.gridY,
        deltaX,
        deltaY,
        gridRect,
        gapPx,
      );

      const finalGrid = clampGridRect({ ...resize.startGrid, gridW, gridH });
      const sizeChanged =
        finalGrid.gridW !== resize.startGrid.gridW ||
        finalGrid.gridH !== resize.startGrid.gridH;

      if (resize.target.hasPointerCapture(resize.pointerId)) {
        resize.target.releasePointerCapture(resize.pointerId);
      }
      resizeRef.current = null;

      if (sizeChanged) {
        void applyAndSave(location, finalGrid);
      } else {
        setGridOverrides((prev) => {
          const next = { ...prev };
          delete next[location.id];
          return next;
        });
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", finishResize);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);
    };
  }, [editMode, locations, applyAndSave]);

  const activeLocation = activeId
    ? locations.find((l) => l.id === activeId)
    : null;

  const mapGrid = (
    <MapGrid
      gridRef={gridRef}
      editMode={editMode}
      locations={locations}
      activeId={activeId}
      savingIds={savingIds}
      getGridFor={getGridFor}
      onClick={handleClick}
      onResizeStart={handleResizeStart}
    />
  );

  const gridContent = editMode ? (
    <div className="touch-none overscroll-contain rounded-xl bg-zinc-50/80 p-1 ring-1 ring-blue-200">
      {mapGrid}
    </div>
  ) : (
    mapGrid
  );

  const mapSection = editMode ? (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {gridContent}
      <DragOverlay dropAnimation={null}>
        {activeLocation && overlaySize ? (
          <LocationCell
            location={activeLocation}
            style={{ width: overlaySize.width, height: overlaySize.height }}
            isOverlay
            editMode
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  ) : (
    gridContent
  );

  return (
    <>
      <div className="relative hidden md:block">{mapSection}</div>

      <LocationDetailModal
        location={selected}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}

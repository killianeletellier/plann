import type { CSSProperties } from "react";

/** Grille de la carte festival (alignée sur FestivalMap). */

export const MAP_GRID_COLS = 12;
export const MAP_GRID_ROWS = 8;
export const MAP_GRID_GAP_PX = 8;

export interface GridRect {
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
}

export function clampGridRect(rect: GridRect): GridRect {
  const gridW = Math.max(1, Math.min(rect.gridW, MAP_GRID_COLS));
  const gridH = Math.max(1, Math.min(rect.gridH, MAP_GRID_ROWS));
  const gridX = Math.max(0, Math.min(rect.gridX, MAP_GRID_COLS - gridW));
  const gridY = Math.max(0, Math.min(rect.gridY, MAP_GRID_ROWS - gridH));
  return { gridX, gridY, gridW, gridH };
}

function parseGapPx(gap: string): number {
  const token = gap.trim().split(/\s+/)[0] ?? "";
  const value = Number.parseFloat(token);
  return Number.isFinite(value) ? value : MAP_GRID_GAP_PX;
}

/** Zone de contenu CSS grid (hors padding) pour aligner snap et overlay. */
export function getGridContentRect(element: HTMLElement): DOMRect {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const padLeft = Number.parseFloat(style.paddingLeft) || 0;
  const padRight = Number.parseFloat(style.paddingRight) || 0;
  const padTop = Number.parseFloat(style.paddingTop) || 0;
  const padBottom = Number.parseFloat(style.paddingBottom) || 0;

  return new DOMRect(
    rect.left + padLeft,
    rect.top + padTop,
    rect.width - padLeft - padRight,
    rect.height - padTop - padBottom,
  );
}

export function getGridGapPx(element: HTMLElement): number {
  const style = getComputedStyle(element);
  return parseGapPx(style.columnGap || style.gap || `${MAP_GRID_GAP_PX}px`);
}

export function getCellSize(
  gridRect: Pick<DOMRect, "width" | "height">,
  gapPx = MAP_GRID_GAP_PX,
) {
  const cellWidth =
    (gridRect.width - gapPx * (MAP_GRID_COLS - 1)) / MAP_GRID_COLS;
  const cellHeight =
    (gridRect.height - gapPx * (MAP_GRID_ROWS - 1)) / MAP_GRID_ROWS;
  return { cellWidth, cellHeight };
}

export function gridPositionFromPoint(
  clientX: number,
  clientY: number,
  gridRect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  itemW: number,
  itemH: number,
  gapPx = MAP_GRID_GAP_PX,
): Pick<GridRect, "gridX" | "gridY"> {
  const { cellWidth, cellHeight } = getCellSize(gridRect, gapPx);
  const relX = clientX - gridRect.left;
  const relY = clientY - gridRect.top;
  const stepX = cellWidth + gapPx;
  const stepY = cellHeight + gapPx;

  const gridX = Math.round((relX - cellWidth / 2) / stepX);
  const gridY = Math.round((relY - cellHeight / 2) / stepY);

  return clampGridRect({
    gridX,
    gridY,
    gridW: itemW,
    gridH: itemH,
  });
}

export function gridPositionFromTranslatedRect(
  translated: Pick<DOMRect, "left" | "top" | "width" | "height">,
  gridRect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  itemW: number,
  itemH: number,
  gapPx = MAP_GRID_GAP_PX,
): Pick<GridRect, "gridX" | "gridY"> {
  const centerX = translated.left + translated.width / 2;
  const centerY = translated.top + translated.height / 2;
  return gridPositionFromPoint(centerX, centerY, gridRect, itemW, itemH, gapPx);
}

export function gridSizeFromPointerDelta(
  startW: number,
  startH: number,
  gridX: number,
  gridY: number,
  deltaX: number,
  deltaY: number,
  gridRect: Pick<DOMRect, "width" | "height">,
  gapPx = MAP_GRID_GAP_PX,
): Pick<GridRect, "gridW" | "gridH"> {
  const { cellWidth, cellHeight } = getCellSize(gridRect, gapPx);
  const stepX = cellWidth + gapPx;
  const stepY = cellHeight + gapPx;
  const deltaCols = Math.round(deltaX / stepX);
  const deltaRows = Math.round(deltaY / stepY);

  return clampGridRect({
    gridX,
    gridY,
    gridW: startW + deltaCols,
    gridH: startH + deltaRows,
  });
}

export function getGridMetrics(element: HTMLElement) {
  return {
    rect: getGridContentRect(element),
    gapPx: getGridGapPx(element),
  };
}

export function gridAreaStyle(rect: GridRect): CSSProperties {
  return {
    gridColumn: `${rect.gridX + 1} / span ${rect.gridW}`,
    gridRow: `${rect.gridY + 1} / span ${rect.gridH}`,
  };
}

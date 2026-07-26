import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import {
  STABLE_EMPTY_LIST,
  STABLE_EVENT_LIST,
  STABLE_MAP_GRID,
} from "@/lib/ui-stable";

export function SkeletonBar({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-200", className)}
      style={style}
      aria-hidden="true"
    />
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBar key={i} className="h-[4.5rem] w-full" />
      ))}
    </div>
  );
}

export function PlanningSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement du planning">
      <SkeletonBar className="h-7 w-48" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBar key={i} className="h-[4.5rem]" />
        ))}
      </div>
      <div className={cn(STABLE_EVENT_LIST, "space-y-4")}>
        <SkeletonBar className="h-5 w-40" />
        <SkeletonBar className="h-24 w-full" />
        <SkeletonBar className="h-24 w-full" />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div
      className={cn(STABLE_MAP_GRID, "hidden md:grid")}
      style={{
        gridTemplateColumns: "repeat(12, 1fr)",
        gridTemplateRows: "repeat(8, minmax(60px, auto))",
      }}
      aria-busy="true"
      aria-label="Chargement de la carte"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonBar
          key={i}
          className="animate-pulse rounded-lg bg-zinc-200"
          style={{
            gridColumn: `${(i % 4) * 3 + 1} / span 3`,
            gridRow: `${Math.floor(i / 4) + 1} / span 2`,
          }}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p className={cn(STABLE_EMPTY_LIST, "text-center", className)}>{message}</p>
  );
}

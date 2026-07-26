"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FestivalMap,
  FestivalMapEditButton,
} from "@/components/dashboard/FestivalMap";
import { DashboardFallback } from "@/components/dashboard/DashboardFallback";
import { ListSkeleton, MapSkeleton } from "@/components/ui/loading-skeleton";
import type { LocationActivity } from "@/lib/dashboard";

const REFRESH_MS = 30_000;

export default function AdminDashboardPage() {
  const [locations, setLocations] = useState<LocationActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const pauseRefreshRef = useRef(false);

  const load = useCallback(async () => {
    if (pauseRefreshRef.current) return;
    const res = await fetch("/api/dashboard");
    if (res.ok) {
      const data = await res.json();
      setLocations(data.locations);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Carte du festival</h2>
        {!loading && (
          <FestivalMapEditButton
            editMode={editMode}
            onEditModeChange={(editing) => {
              setEditMode(editing);
              pauseRefreshRef.current = editing;
            }}
          />
        )}
      </div>
      {loading ? (
        <>
          <MapSkeleton />
          <ListSkeleton count={3} />
        </>
      ) : (
        <>
          <FestivalMap
            locations={locations}
            editable
            editMode={editMode}
            onLocationsChange={setLocations}
          />
          <DashboardFallback locations={locations} />
        </>
      )}
    </div>
  );
}

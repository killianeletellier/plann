"use client";

import { SelectionGrid, type SelectionItem } from "./SelectionGrid";

interface ArtistOption {
  id: string;
  label: string;
  subtitle?: string;
}

interface ArtistSelectionGridProps {
  artists: ArtistOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export function ArtistSelectionGrid({
  artists,
  selectedIds,
  onChange,
  className,
}: ArtistSelectionGridProps) {
  const items: SelectionItem[] = artists.map((a) => ({
    id: a.id,
    label: a.label,
    subtitle: a.subtitle,
  }));

  return (
    <SelectionGrid
      mode="single"
      items={items}
      selectedIds={selectedIds}
      onChange={onChange}
      emptyLabel="Aucun"
      className={className}
    />
  );
}

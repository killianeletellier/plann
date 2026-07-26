"use client";

import { SelectionGrid, type SelectionItem } from "./SelectionGrid";

interface VolunteerOption {
  id: string;
  label: string;
  subtitle?: string;
}

interface VolunteerSelectionGridProps {
  volunteers: VolunteerOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export function VolunteerSelectionGrid({
  volunteers,
  selectedIds,
  onChange,
  className,
}: VolunteerSelectionGridProps) {
  const items: SelectionItem[] = volunteers.map((v) => ({
    id: v.id,
    label: v.label,
    subtitle: v.subtitle,
  }));

  return (
    <SelectionGrid
      mode="multiple"
      items={items}
      selectedIds={selectedIds}
      onChange={onChange}
      className={className}
    />
  );
}

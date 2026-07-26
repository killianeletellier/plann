"use client";

import { Label } from "@/components/ui/label";
import type { VolunteerAssignment } from "@/lib/volunteer-display";
import { VolunteerRoleSelect } from "./VolunteerRoleSelect";
import { VolunteerSelectionGrid } from "./VolunteerSelectionGrid";

interface VolunteerOption {
  id: string;
  label: string;
  subtitle?: string;
}

interface VolunteerAssignmentEditorProps {
  volunteers: VolunteerOption[];
  roles: Array<{ id: string; name: string }>;
  assignments: VolunteerAssignment[];
  onChange: (assignments: VolunteerAssignment[]) => void;
  className?: string;
}

export function VolunteerAssignmentEditor({
  volunteers,
  roles,
  assignments,
  onChange,
  className,
}: VolunteerAssignmentEditorProps) {
  const selectedIds = assignments.map((a) => a.userId);

  function handleSelectionChange(ids: string[]) {
    const next = ids.map((userId) => {
      const existing = assignments.find((a) => a.userId === userId);
      return existing ?? { userId, role: null };
    });
    onChange(next);
  }

  function handleRoleChange(userId: string, role: string | null) {
    onChange(
      assignments.map((a) =>
        a.userId === userId ? { ...a, role: role || null } : a,
      ),
    );
  }

  const volunteerMap = new Map(volunteers.map((v) => [v.id, v]));

  return (
    <div className={className}>
      <VolunteerSelectionGrid
        volunteers={volunteers}
        selectedIds={selectedIds}
        onChange={handleSelectionChange}
      />
      {assignments.length > 0 && (
        <div className="mt-3 space-y-3">
          <p className="text-xs font-medium text-zinc-700">Rôles des bénévoles</p>
          {assignments.map((assignment) => {
            const volunteer = volunteerMap.get(assignment.userId);
            if (!volunteer) return null;
            return (
              <div
                key={assignment.userId}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-2"
              >
                <p className="text-sm font-medium">{volunteer.label}</p>
                <div>
                  <Label className="text-xs text-zinc-500">Rôle</Label>
                  <VolunteerRoleSelect
                    id={`role-${assignment.userId}`}
                    roles={roles}
                    value={assignment.role}
                    onChange={(role) => handleRoleChange(assignment.userId, role)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export type VolunteerWithUser = {
  userId: string;
  role?: string | null;
  user?: { firstName: string; lastName: string } | null;
};

export type VolunteerAssignment = {
  userId: string;
  role?: string | null;
};

export function formatVolunteerName(
  user: { firstName: string; lastName: string },
  role?: string | null,
): string {
  const name = `${user.firstName} ${user.lastName}`;
  return role ? `${name} (${role})` : name;
}

export function formatVolunteers(volunteers?: VolunteerWithUser[]): string[] {
  return (volunteers || [])
    .filter((v) => v.user)
    .map((v) => formatVolunteerName(v.user!, v.role));
}

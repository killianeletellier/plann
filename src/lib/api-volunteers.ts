import { v4 as uuidv4 } from "uuid";
import type { VolunteerAssignment } from "@/lib/volunteer-display";

export function mapAnimationVolunteerInserts(
  animationId: string,
  volunteers: VolunteerAssignment[],
) {
  return volunteers.map((v) => ({
    id: uuidv4(),
    animationId,
    userId: v.userId,
    role: v.role || null,
  }));
}

export function mapTaskVolunteerInserts(
  taskId: string,
  volunteers: VolunteerAssignment[],
) {
  return volunteers.map((v) => ({
    id: uuidv4(),
    taskId,
    userId: v.userId,
    role: v.role || null,
  }));
}

export function mapSlotVolunteerInserts(
  slotId: string,
  volunteers: VolunteerAssignment[],
) {
  return volunteers.map((v) => ({
    id: uuidv4(),
    slotId,
    userId: v.userId,
    role: v.role || null,
  }));
}

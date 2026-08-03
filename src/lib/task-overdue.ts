import { isPast, parseISO } from "date-fns";
import { compareSlotsChronologically } from "@/lib/dates";
import type { TaskStatus } from "@/lib/task-status";
import { UNASSIGNED_HIGHLIGHT_CLASS } from "@/lib/unassigned";

/** Une tâche est en retard si l'échéance (endAt) est dépassée et le statut n'est pas « fait ». */
export function isTaskOverdue(endAt: string, status: TaskStatus): boolean {
  if (status === "fait") return false;
  return isPast(parseISO(endAt));
}

export const OVERDUE_HIGHLIGHT_CLASS = "border-red-300 bg-red-50";

export function getTaskRowHighlightClass(options: {
  overdue?: boolean;
  unassigned?: boolean;
}): string {
  if (options.overdue) return OVERDUE_HIGHLIGHT_CLASS;
  if (options.unassigned) return UNASSIGNED_HIGHLIGHT_CLASS;
  return "border-zinc-200 bg-white";
}

export function withTaskOverdue<T extends { endAt: string; status: TaskStatus }>(
  task: T,
): T & { isOverdue: boolean } {
  return {
    ...task,
    isOverdue: isTaskOverdue(task.endAt, task.status),
  };
}

/** Retards en tête, puis tri chronologique par date de début. */
export function sortTasksOverdueFirst<
  T extends { endAt: string; status: TaskStatus; startAt: string },
>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const aOverdue = isTaskOverdue(a.endAt, a.status);
    const bOverdue = isTaskOverdue(b.endAt, b.status);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (aOverdue && bOverdue) {
      return parseISO(a.endAt).getTime() - parseISO(b.endAt).getTime();
    }
    return compareSlotsChronologically(a, b);
  });
}

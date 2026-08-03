export const TASK_STATUSES = ["a_faire", "en_cours", "fait"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  fait: "Fait",
};

export const TASK_STATUS_BADGE_VARIANT: Record<
  TaskStatus,
  "default" | "warning" | "info" | "success"
> = {
  a_faire: "default",
  en_cours: "warning",
  fait: "success",
};

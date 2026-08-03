"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrudFormDialog } from "@/components/ui/crud-form-dialog";
import { useConfirm } from "@/components/ui/confirm-provider";
import { EmptyState } from "@/components/ui/loading-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";
import { TaskForm } from "@/components/forms/TaskForm";
import {
  TASK_STATUSES,
  TASK_STATUS_BADGE_VARIANT,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/lib/task-status";
import { formatVolunteers } from "@/lib/volunteer-display";
import {
  getTaskRowHighlightClass,
  isTaskOverdue,
  sortTasksOverdueFirst,
} from "@/lib/task-overdue";
import { isTaskUnassigned } from "@/lib/unassigned";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  color?: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  status: TaskStatus;
  locationId?: string | null;
  location?: { name: string } | null;
  volunteers?: Array<{
    userId: string;
    role?: string | null;
    user?: { firstName: string; lastName: string };
  }>;
}

export default function TachesPage() {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<{ id: string; label: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; label: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const load = useCallback(async () => {
    const [taskRes, userRes, locRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/users"),
      fetch("/api/locations"),
    ]);
    if (taskRes.ok) setTasks(await taskRes.json());
    if (userRes.ok) {
      const u = await userRes.json();
      setVolunteers(u.map((x: { id: string; firstName: string; lastName: string }) => ({
        id: x.id,
        label: `${x.firstName} ${x.lastName}`,
      })));
    }
    if (locRes.ok) {
      const l = await locRes.json();
      setLocations(l.map((x: { id: string; name: string }) => ({ id: x.id, label: x.name })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let result = tasks;
    if (statusFilter === "overdue") {
      result = tasks.filter((t) => isTaskOverdue(t.endAt, t.status));
    } else if (statusFilter !== "all") {
      result = tasks.filter((t) => t.status === statusFilter);
    }
    return sortTasksOverdueFirst(result);
  }, [tasks, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: tasks.length,
      overdue: tasks.filter((t) => isTaskOverdue(t.endAt, t.status)).length,
    };
    for (const s of TASK_STATUSES) {
      c[s] = tasks.filter((t) => t.status === s).length;
    }
    return c;
  }, [tasks]);

  async function handleSubmit(data: Record<string, unknown>) {
    const url = editing ? `/api/tasks/${editing.id}` : "/api/tasks";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast({ type: "error", message: "Erreur lors de l'enregistrement" });
      throw new Error("save failed");
    }
    toast({ type: "success", message: editing ? "Tâche modifiée" : "Tâche créée" });
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!(await confirm({
      title: "Supprimer cette tâche ?",
      confirmLabel: "Supprimer",
      variant: "destructive",
    }))) return;
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ type: "success", message: "Tâche supprimée" });
      load();
    } else {
      toast({ type: "error", message: "Erreur lors de la suppression" });
    }
  }

  async function updateStatus(taskId: string, status: TaskStatus) {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      toast({ type: "success", message: "Statut mis à jour" });
    } else {
      toast({ type: "error", message: "Erreur lors de la mise à jour" });
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Tâches</h2>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nouvelle tâche
        </Button>
      </div>

      <CrudFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Modifier la tâche" : "Nouvelle tâche"}
      >
        <TaskForm
          key={editing?.id ?? "new"}
          variant="plain"
          initial={editing ? {
            title: editing.title,
            description: editing.description || undefined,
            volunteers: editing.volunteers?.map((v) => ({
              userId: v.userId,
              role: v.role ?? null,
            })) || [],
            locationId: editing.locationId,
            startAt: editing.startAt,
            endAt: editing.endAt,
            status: editing.status,
            color: editing.color,
          } : undefined}
          volunteers={volunteers}
          locations={locations}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </CrudFormDialog>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "rounded-lg border p-3 text-left transition-colors",
            statusFilter === "all" ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white",
          )}
        >
          <p className="text-2xl font-bold">{counts.all}</p>
          <p className="text-xs text-zinc-500">Total</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("overdue")}
          className={cn(
            "rounded-lg border p-3 text-left transition-colors",
            statusFilter === "overdue"
              ? "border-red-600 bg-red-50"
              : counts.overdue > 0
                ? "border-red-200 bg-red-50/50"
                : "border-zinc-200 bg-white",
          )}
        >
          <p className={cn("text-2xl font-bold", counts.overdue > 0 && "text-red-700")}>
            {counts.overdue}
          </p>
          <p className="text-xs text-zinc-500">En retard</p>
        </button>
        {TASK_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              statusFilter === s ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white",
            )}
          >
            <p className="text-2xl font-bold">{counts[s] ?? 0}</p>
            <p className="text-xs text-zinc-500">{TASK_STATUS_LABELS[s]}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600">Filtrer :</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="overdue">En retard</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Aucune tâche ne correspond au filtre" />
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const unassigned = isTaskUnassigned(task.volunteers);
            const overdue = isTaskOverdue(task.endAt, task.status);
            return (
              <div
                key={task.id}
                className={cn(
                  "rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                  getTaskRowHighlightClass({ overdue, unassigned }),
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{task.title}</p>
                    <Badge variant={TASK_STATUS_BADGE_VARIANT[task.status]}>
                      {TASK_STATUS_LABELS[task.status]}
                    </Badge>
                    {overdue && (
                      <Badge variant="danger" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        En retard
                      </Badge>
                    )}
                    {unassigned && <Badge variant="warning">Sans bénévole</Badge>}
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    {format(parseISO(task.startAt), "dd/MM HH:mm", { locale: fr })} —{" "}
                    {format(parseISO(task.endAt), "HH:mm", { locale: fr })}
                    {task.location ? ` · ${task.location.name}` : ""}
                  </p>
                  <p className="text-sm text-zinc-600 mt-0.5">
                    {formatVolunteers(task.volunteers).join(", ") || "Aucun bénévole assigné"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={task.status}
                    onValueChange={(v) => updateStatus(task.id, v as TaskStatus)}
                  >
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => { setEditing(task); setShowForm(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

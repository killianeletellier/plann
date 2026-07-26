"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CrudFormDialog } from "@/components/ui/crud-form-dialog";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { TaskForm } from "@/components/forms/TaskForm";
import { formatVolunteers } from "@/lib/volunteer-display";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
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
  const [items, setItems] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<{ id: string; label: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; label: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const load = useCallback(async () => {
    const [taskRes, userRes, locRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/users"),
      fetch("/api/locations"),
    ]);
    if (taskRes.ok) setItems(await taskRes.json());
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
  }, []);

  useEffect(() => { load(); }, [load]);

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

  function volunteerLabels(task: Task): string {
    return formatVolunteers(task.volunteers).join(", ");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tâches</h2>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Ajouter
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
          } : undefined}
          volunteers={volunteers}
          locations={locations}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </CrudFormDialog>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 min-h-[4.5rem]">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-zinc-500">
                {format(parseISO(item.startAt), "dd/MM HH:mm", { locale: fr })} —{" "}
                {volunteerLabels(item)}
                {item.location ? ` · ${item.location.name}` : ""}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="icon" onClick={() => { setEditing(item); setShowForm(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

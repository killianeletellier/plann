"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, ChevronUp, GanttChart, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CrudFormDialog } from "@/components/ui/crud-form-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { PostForm, SlotGenerator } from "@/components/forms/PostForm";
import { VolunteerAssignmentEditor } from "@/components/forms/VolunteerAssignmentEditor";
import type { VolunteerAssignment } from "@/lib/volunteer-display";
import { isSlotUnassigned, UNASSIGNED_HIGHLIGHT_CLASS } from "@/lib/unassigned";
import { STABLE_OVERLAY } from "@/lib/ui-stable";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  description: string | null;
  color?: string;
  locationId?: string;
  location?: { name: string };
  slots?: Array<{
    id: string;
    startAt: string;
    endAt: string;
    volunteers?: Array<{
      userId: string;
      role?: string | null;
      user?: { firstName: string; lastName: string } | null;
    }>;
  }>;
}

export default function PostesPage() {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [items, setItems] = useState<Post[]>([]);
  const [locations, setLocations] = useState<{ id: string; label: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [postRes, locRes, userRes, roleRes] = await Promise.all([
      fetch("/api/posts"),
      fetch("/api/locations"),
      fetch("/api/users"),
      fetch("/api/roles"),
    ]);
    if (postRes.ok) setItems(await postRes.json());
    if (locRes.ok) {
      const l = await locRes.json();
      setLocations(l.map((x: { id: string; name: string }) => ({ id: x.id, label: x.name })));
    }
    if (userRes.ok) {
      const u = await userRes.json();
      setUsers(u.map((x: { id: string; firstName: string; lastName: string }) => ({
        id: x.id,
        label: `${x.firstName} ${x.lastName}`,
      })));
    }
    if (roleRes.ok) setRoles(await roleRes.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: Record<string, unknown>) {
    const url = editing ? `/api/posts/${editing.id}` : "/api/posts";
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
    toast({ type: "success", message: editing ? "Poste modifié" : "Poste créé" });
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!(await confirm({
      title: "Supprimer ce poste et tous ses créneaux ?",
      confirmLabel: "Supprimer",
      variant: "destructive",
    }))) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ type: "success", message: "Poste supprimé" });
      load();
    } else {
      toast({ type: "error", message: "Erreur lors de la suppression" });
    }
  }

  async function assignSlot(slotId: string, volunteers: VolunteerAssignment[]) {
    setSavingSlotId(slotId);
    try {
      const slotRes = await fetch(`/api/slots/${slotId}`);
      if (!slotRes.ok) {
        toast({ type: "error", message: "Erreur lors de l'assignation" });
        return;
      }
      const slot = await slotRes.json();
      const res = await fetch(`/api/slots/${slotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: slot.postId,
          volunteers,
          startAt: slot.startAt,
          endAt: slot.endAt,
        }),
      });
      if (res.ok) {
        toast({ type: "success", message: "Créneau mis à jour" });
        await load();
      } else {
        toast({ type: "error", message: "Erreur lors de l'assignation" });
      }
    } finally {
      setSavingSlotId(null);
    }
  }

  async function deleteSlot(slotId: string) {
    if (!(await confirm({
      title: "Supprimer ce créneau ?",
      confirmLabel: "Supprimer",
      variant: "destructive",
    }))) return;
    const res = await fetch(`/api/slots/${slotId}`, { method: "DELETE" });
    if (res.ok) {
      toast({ type: "success", message: "Créneau supprimé" });
      load();
    } else {
      toast({ type: "error", message: "Erreur lors de la suppression" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Postes</h2>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/gantt?mode=location" title="Vue Gantt">
              <GanttChart className="h-4 w-4 mr-1" /> Gantt
            </Link>
          </Button>
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter
          </Button>
        </div>
      </div>
      <CrudFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Modifier le poste" : "Nouveau poste"}
      >
        <PostForm
          key={editing?.id ?? "new"}
          variant="plain"
          initial={editing ? {
            title: editing.title,
            description: editing.description || undefined,
            locationId: editing.locationId,
            color: editing.color,
          } : undefined}
          locations={locations}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </CrudFormDialog>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between p-4 min-h-[4.5rem]">
              <div>
                <p className="font-medium">{item.title}</p>
                <div className="mt-1 min-h-[1.5rem]">
                  {item.location && <Badge variant="default">{item.location.name}</Badge>}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{item.slots?.length || 0} créneaux</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                  {expanded === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => { setEditing(item); setShowForm(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {expanded === item.id && (
              <div className="border-t border-zinc-100 p-4 space-y-4 bg-zinc-50">
                <SlotGenerator postId={item.id} onGenerated={load} />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Créneaux</h4>
                  {(item.slots || []).map((slot) => {
                    const assignments: VolunteerAssignment[] = (slot.volunteers || []).map((v) => ({
                      userId: v.userId,
                      role: v.role ?? null,
                    }));
                    const isSaving = savingSlotId === slot.id;
                    const unassigned = isSlotUnassigned(slot.volunteers);
                    return (
                      <div key={slot.id} className={cn(
                        "relative rounded-lg border p-3 text-sm space-y-2 min-h-[8rem]",
                        unassigned ? UNASSIGNED_HIGHLIGHT_CLASS : "bg-white",
                      )}>
                        {isSaving && (
                          <div className={cn(STABLE_OVERLAY, "rounded-lg")}>
                            <Spinner className="h-5 w-5 text-zinc-600" />
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span>
                            {format(parseISO(slot.startAt), "dd/MM HH:mm", { locale: fr })} —{" "}
                            {format(parseISO(slot.endAt), "HH:mm", { locale: fr })}
                          </span>
                          <div className="flex items-center gap-2">
                            {unassigned && <Badge variant="warning">Sans bénévole</Badge>}
                            <Button variant="ghost" size="icon" onClick={() => deleteSlot(slot.id)} disabled={isSaving}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-zinc-700">Bénévoles</p>
                          <VolunteerAssignmentEditor
                            volunteers={users}
                            roles={roles}
                            assignments={assignments}
                            onChange={(volunteers) => assignSlot(slot.id, volunteers)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

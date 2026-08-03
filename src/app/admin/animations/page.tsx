"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CrudFormDialog } from "@/components/ui/crud-form-dialog";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { AnimationForm } from "@/components/forms/AnimationForm";
import { formatVolunteers } from "@/lib/volunteer-display";
import { isAnimationUnassigned, UNASSIGNED_HIGHLIGHT_CLASS } from "@/lib/unassigned";
import { cn } from "@/lib/utils";

interface Animation {
  id: string;
  title: string;
  color?: string;
  startAt: string;
  endAt: string;
  artistId?: string | null;
  location?: { name: string };
  artist?: { name: string } | null;
  volunteers?: Array<{
    userId: string;
    role?: string | null;
    user?: { firstName: string; lastName: string };
  }>;
}

export default function AnimationsPage() {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [items, setItems] = useState<Animation[]>([]);
  const [locations, setLocations] = useState<{ id: string; label: string }[]>([]);
  const [artists, setArtists] = useState<{ id: string; label: string }[]>([]);
  const [volunteers, setVolunteers] = useState<{ id: string; label: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Animation | null>(null);

  const load = useCallback(async () => {
    const [animRes, locRes, artRes, userRes] = await Promise.all([
      fetch("/api/animations"),
      fetch("/api/locations"),
      fetch("/api/artists"),
      fetch("/api/users"),
    ]);
    if (animRes.ok) setItems(await animRes.json());
    if (locRes.ok) {
      const locs = await locRes.json();
      setLocations(locs.map((l: { id: string; name: string }) => ({ id: l.id, label: l.name })));
    }
    if (artRes.ok) {
      const arts = await artRes.json();
      setArtists(arts.map((a: { id: string; name: string }) => ({ id: a.id, label: a.name })));
    }
    if (userRes.ok) {
      const users = await userRes.json();
      setVolunteers(users.map((u: { id: string; firstName: string; lastName: string }) => ({
        id: u.id,
        label: `${u.firstName} ${u.lastName}`,
      })));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: Record<string, unknown>) {
    const url = editing ? `/api/animations/${editing.id}` : "/api/animations";
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
    toast({ type: "success", message: editing ? "Animation modifiée" : "Animation créée" });
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!(await confirm({
      title: "Supprimer cette animation ?",
      confirmLabel: "Supprimer",
      variant: "destructive",
    }))) return;
    const res = await fetch(`/api/animations/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ type: "success", message: "Animation supprimée" });
      load();
    } else {
      toast({ type: "error", message: "Erreur lors de la suppression" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Animations</h2>
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
        title={editing ? "Modifier l'animation" : "Nouvelle animation"}
      >
        <AnimationForm
          key={editing?.id ?? "new"}
          variant="plain"
          initial={editing ? {
            title: editing.title,
            locationId: (editing as Animation & { locationId?: string }).locationId,
            artistId: (editing as Animation & { artistId?: string | null }).artistId,
            volunteers: editing.volunteers?.map((v) => ({
              userId: v.userId,
              role: v.role ?? null,
            })) || [],
            startAt: editing.startAt,
            endAt: editing.endAt,
            color: editing.color,
          } : undefined}
          locations={locations}
          artists={artists}
          volunteers={volunteers}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </CrudFormDialog>
      <div className="space-y-2">
        {items.map((item) => {
          const unassigned = isAnimationUnassigned(item.volunteers, item.artistId);
          return (
          <div key={item.id} className={cn(
            "rounded-lg border p-4 min-h-[5rem]",
            unassigned ? UNASSIGNED_HIGHLIGHT_CLASS : "border-zinc-200 bg-white",
          )}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{item.title}</p>
                  {unassigned && <Badge variant="warning">Sans bénévole</Badge>}
                </div>
                <p className="text-sm text-zinc-500 mt-1">
                  {format(parseISO(item.startAt), "dd/MM HH:mm", { locale: fr })} —{" "}
                  {format(parseISO(item.endAt), "HH:mm", { locale: fr })}
                  {(item.volunteers?.length ?? 0) > 0 && (
                    <> · {formatVolunteers(item.volunteers).join(", ")}</>
                  )}
                </p>
                <div className="mt-2 min-h-[1.5rem]">
                  {item.location && <Badge variant="default">{item.location.name}</Badge>}
                </div>
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
          </div>
          );
        })}
      </div>
    </div>
  );
}

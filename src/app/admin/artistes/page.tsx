"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CrudFormDialog } from "@/components/ui/crud-form-dialog";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { ArtistForm } from "@/components/forms/ArtistForm";

interface Artist {
  id: string;
  name: string;
  phone: string | null;
  description: string | null;
}

export default function ArtistesPage() {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [items, setItems] = useState<Artist[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Artist | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/artists");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: Record<string, unknown>) {
    const url = editing ? `/api/artists/${editing.id}` : "/api/artists";
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
    toast({ type: "success", message: editing ? "Artiste modifié" : "Artiste créé" });
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!(await confirm({
      title: "Supprimer cet artiste ?",
      confirmLabel: "Supprimer",
      variant: "destructive",
    }))) return;
    const res = await fetch(`/api/artists/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ type: "success", message: "Artiste supprimé" });
      load();
    } else {
      toast({ type: "error", message: "Erreur lors de la suppression" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Artistes</h2>
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
        title={editing ? "Modifier l'artiste" : "Nouvel artiste"}
      >
        <ArtistForm
          key={editing?.id ?? "new"}
          variant="plain"
          initial={editing || undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </CrudFormDialog>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 min-h-[4.5rem]">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-zinc-500 min-h-[1.25rem]">{item.phone ?? "\u00A0"}</p>
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

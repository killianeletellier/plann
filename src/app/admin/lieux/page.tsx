"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CrudFormDialog } from "@/components/ui/crud-form-dialog";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { LocationForm } from "@/components/forms/LocationForm";

interface Location {
  id: string;
  name: string;
  type: string;
  description: string | null;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
}

const typeLabels: Record<string, string> = {
  scene: "Scène",
  point_de_vente: "Point de vente",
  autre: "Autre",
};

export default function LieuxPage() {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [items, setItems] = useState<Location[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/locations");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: Record<string, unknown>) {
    const url = editing ? `/api/locations/${editing.id}` : "/api/locations";
    const method = editing ? "PUT" : "POST";
    const payload = editing
      ? {
          ...data,
          gridX: editing.gridX,
          gridY: editing.gridY,
          gridW: editing.gridW,
          gridH: editing.gridH,
        }
      : data;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      toast({ type: "error", message: "Erreur lors de l'enregistrement" });
      throw new Error("save failed");
    }
    toast({ type: "success", message: editing ? "Lieu modifié" : "Lieu créé" });
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!(await confirm({
      title: "Supprimer ce lieu ?",
      confirmLabel: "Supprimer",
      variant: "destructive",
    }))) return;
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ type: "success", message: "Lieu supprimé" });
      load();
    } else {
      toast({ type: "error", message: "Erreur lors de la suppression" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lieux</h2>
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
        title={editing ? "Modifier le lieu" : "Nouveau lieu"}
      >
        <LocationForm
          key={editing?.id ?? "new"}
          variant="plain"
          initial={editing || undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </CrudFormDialog>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 min-h-[5rem]">
            <div>
              <p className="font-medium">{item.name}</p>
              <Badge variant="default" className="mt-1">{typeLabels[item.type]}</Badge>
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

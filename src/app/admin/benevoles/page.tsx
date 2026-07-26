"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CrudFormDialog } from "@/components/ui/crud-form-dialog";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { UserForm } from "@/components/forms/UserForm";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isAdmin: boolean;
}

export default function BenevolesPage() {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [items, setItems] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: Record<string, unknown>) {
    const url = editing ? `/api/users/${editing.id}` : "/api/users";
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
    toast({ type: "success", message: editing ? "Bénévole modifié" : "Bénévole créé" });
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!(await confirm({
      title: "Supprimer ce bénévole ?",
      confirmLabel: "Supprimer",
      variant: "destructive",
    }))) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ type: "success", message: "Bénévole supprimé" });
      load();
    } else {
      toast({ type: "error", message: "Erreur lors de la suppression" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Bénévoles</h2>
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
        title={editing ? "Modifier le bénévole" : "Nouveau bénévole"}
      >
        <UserForm
          key={editing?.id ?? "new"}
          variant="plain"
          initial={editing || undefined}
          isEdit={!!editing}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </CrudFormDialog>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 min-h-[4.5rem]">
            <div>
              <p className="font-medium">{item.firstName} {item.lastName}</p>
              <p className="text-sm text-zinc-500 min-h-[1.25rem]">{item.phone ?? "\u00A0"}</p>
              <div className="mt-1 min-h-[1.5rem]">
                {item.isAdmin && <Badge variant="info">Admin</Badge>}
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
        ))}
      </div>
    </div>
  );
}

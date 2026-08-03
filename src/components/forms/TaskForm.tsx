"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast-provider";
import type { VolunteerAssignment } from "@/lib/volunteer-display";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/lib/task-status";
import { VolunteerAssignmentEditor } from "./VolunteerAssignmentEditor";
import { ColorPicker } from "./ColorPicker";
import { defaultMissionColor } from "@/lib/mission-color";

interface Option {
  id: string;
  label: string;
}

interface TaskFormProps {
  initial?: {
    title?: string;
    description?: string;
    volunteers?: VolunteerAssignment[];
    locationId?: string | null;
    startAt?: string;
    endAt?: string;
    status?: TaskStatus;
    color?: string;
  };
  volunteers: Option[];
  locations: Option[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  variant?: "card" | "plain";
}

function toLocalDatetime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function TaskForm({
  initial,
  volunteers,
  locations,
  onSubmit,
  onCancel,
  variant = "card",
}: TaskFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    volunteers: initial?.volunteers || ([] as VolunteerAssignment[]),
    locationId: initial?.locationId || "",
    startAt: toLocalDatetime(initial?.startAt),
    endAt: toLocalDatetime(initial?.endAt),
    status: initial?.status ?? "a_faire",
    color: initial?.color || "",
  });

  useEffect(() => {
    fetch("/api/roles")
      .then((res) => (res.ok ? res.json() : []))
      .then(setRoles)
      .catch(() => setRoles([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        title: form.title,
        description: form.description,
        volunteers: form.volunteers,
        locationId: form.locationId || null,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        status: form.status,
        color: form.color || defaultMissionColor(form.title),
      });
    } catch {
      toast({ type: "error", message: "Erreur lors de l'enregistrement" });
    } finally {
      setLoading(false);
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Titre</Label>
        <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div>
        <Label>Bénévoles</Label>
        <p className="mt-1 mb-2 text-xs text-zinc-500">
          Optionnel en phase d&apos;organisation. Les tâches sans bénévole seront mises en
          évidence.
        </p>
        <VolunteerAssignmentEditor
          volunteers={volunteers}
          roles={roles}
          assignments={form.volunteers}
          onChange={(volunteers) => setForm({ ...form, volunteers })}
        />
      </div>
      <div>
        <Label>Lieu (optionnel)</Label>
        <Select value={form.locationId || "none"} onValueChange={(v) => setForm({ ...form, locationId: v === "none" ? "" : v })}>
          <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Statut</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="min-w-0">
          <Label htmlFor="startAt">Début</Label>
          <Input id="startAt" type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} required />
        </div>
        <div className="min-w-0">
          <Label htmlFor="endAt">Fin</Label>
          <Input id="endAt" type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} required />
        </div>
      </div>
      <ColorPicker
        value={form.color}
        onChange={(color) => setForm({ ...form, color })}
        defaultFromName={form.title}
      />
      <div className="flex flex-wrap gap-2">
        <SubmitButton loading={loading} />
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>}
      </div>
    </form>
  );

  if (variant === "plain") return formContent;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial?.title ? "Modifier la tâche" : "Nouvelle tâche"}</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArtistSelectionGrid } from "./ArtistSelectionGrid";
import { VolunteerAssignmentEditor } from "./VolunteerAssignmentEditor";
import { ColorPicker } from "./ColorPicker";
import { defaultMissionColor } from "@/lib/mission-color";

interface Option {
  id: string;
  label: string;
}

interface AnimationFormProps {
  initial?: {
    title?: string;
    locationId?: string;
    artistId?: string | null;
    volunteers?: VolunteerAssignment[];
    startAt?: string;
    endAt?: string;
    color?: string;
  };
  locations: Option[];
  artists: Option[];
  volunteers: Option[];
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

export function AnimationForm({
  initial,
  locations,
  artists,
  volunteers,
  onSubmit,
  onCancel,
  variant = "card",
}: AnimationFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    title: initial?.title || "",
    locationId: initial?.locationId || "",
    artistId: initial?.artistId || "",
    volunteers: initial?.volunteers || [] as VolunteerAssignment[],
    startAt: toLocalDatetime(initial?.startAt),
    endAt: toLocalDatetime(initial?.endAt),
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
        locationId: form.locationId,
        artistId: form.artistId || null,
        volunteers: form.volunteers,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
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
        <Label>Lieu</Label>
        <Select value={form.locationId} onValueChange={(v) => setForm({ ...form, locationId: v })}>
          <SelectTrigger><SelectValue placeholder="Choisir un lieu" /></SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Artiste</Label>
        <p className="mt-1 mb-2 text-xs text-zinc-500">
          Optionnel si au moins un bénévole est sélectionné.
        </p>
        <ArtistSelectionGrid
          artists={artists}
          selectedIds={form.artistId ? [form.artistId] : []}
          onChange={(ids) => setForm({ ...form, artistId: ids[0] || "" })}
        />
      </div>
      <div>
        <Label>Bénévoles</Label>
        <p className="mt-1 mb-2 text-xs text-zinc-500">
          Optionnel en phase d&apos;organisation. Les animations sans bénévole ni artiste seront
          mises en évidence.
        </p>
        <VolunteerAssignmentEditor
          volunteers={volunteers}
          roles={roles}
          assignments={form.volunteers}
          onChange={(volunteers) => setForm({ ...form, volunteers })}
        />
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
        <CardTitle>{initial?.title ? "Modifier l'animation" : "Nouvelle animation"}</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

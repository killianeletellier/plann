"use client";

import { useEffect, useState } from "react";
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
import { ColorPicker } from "@/components/forms/ColorPicker";
import { defaultMissionColor } from "@/lib/mission-color";
import { WEEK_DAYS } from "@/lib/dates";

interface Option {
  id: string;
  label: string;
}

interface PostFormProps {
  initial?: { title?: string; description?: string | null; locationId?: string; color?: string };
  locations: Option[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  variant?: "card" | "plain";
}

export function PostForm({
  initial,
  locations,
  onSubmit,
  onCancel,
  variant = "card",
}: PostFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    locationId: initial?.locationId || "",
    color: initial?.color || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...form,
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
        <CardTitle>{initial?.title ? "Modifier le poste" : "Nouveau poste"}</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

interface SlotGeneratorProps {
  postId: string;
  onGenerated: () => void;
}

export function SlotGenerator({ postId, onGenerated }: SlotGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    dailyStartTime: "10:00",
    dailyEndTime: "22:00",
    slotDurationMinutes: 120,
    days: [5, 6, 0] as number[],
  });

  useEffect(() => {
    async function loadFestivalDates() {
      const res = await fetch("/api/festival");
      if (!res.ok) return;
      const festival = await res.json();
      setForm((current) => ({
        ...current,
        startDate: festival.startDate,
        endDate: festival.endDate,
      }));
    }
    loadFestivalDates();
  }, []);

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/slots/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Erreur");
      toast({ type: "success", message: data.message || "Créneaux générés" });
      onGenerated();
    } catch (err) {
      toast({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur lors de la génération",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Générer des créneaux</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label>Date début</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="min-w-0">
              <Label>Date fin</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label>Heure début</Label>
              <Input type="time" value={form.dailyStartTime} onChange={(e) => setForm({ ...form, dailyStartTime: e.target.value })} />
            </div>
            <div className="min-w-0">
              <Label>Heure fin</Label>
              <Input type="time" value={form.dailyEndTime} onChange={(e) => setForm({ ...form, dailyEndTime: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Durée créneau (minutes)</Label>
            <Input type="number" min={15} step={15} value={form.slotDurationMinutes} onChange={(e) => setForm({ ...form, slotDurationMinutes: parseInt(e.target.value) })} />
          </div>
          <div>
            <Label>Jours</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {WEEK_DAYS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  className={`min-h-11 min-w-11 rounded-lg border px-3 text-sm ${form.days.includes(value) ? "bg-zinc-900 text-white" : "bg-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <SubmitButton loading={loading} loadingLabel="Génération">
            Générer
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

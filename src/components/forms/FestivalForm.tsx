"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast-provider";

export interface FestivalFormValues {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
}

interface FestivalFormProps {
  initial: FestivalFormValues;
  onSubmit: (data: FestivalFormValues) => Promise<void>;
  variant?: "card" | "plain";
}

export function FestivalForm({
  initial,
  onSubmit,
  variant = "card",
}: FestivalFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FestivalFormValues>(initial);

  function updateField<K extends keyof FestivalFormValues>(
    key: K,
    value: FestivalFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
    } catch {
      toast({ type: "error", message: "Erreur lors de l'enregistrement" });
    } finally {
      setLoading(false);
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="festival-name">Nom du festival</Label>
        <Input
          id="festival-name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Ex. C15 Festival 2026"
          required
        />
      </div>
      <div>
        <Label htmlFor="festival-code">Code festival</Label>
        <Input
          id="festival-code"
          value={form.code}
          onChange={(e) => updateField("code", e.target.value)}
          placeholder="Ex. C15-2026"
          required
        />
        <p className="text-xs text-zinc-500 mt-1">
          Code utilisé par les bénévoles pour se connecter.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="festival-start">Date de début</Label>
          <Input
            id="festival-start"
            type="date"
            value={form.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="festival-end">Date de fin</Label>
          <Input
            id="festival-end"
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={(e) => updateField("endDate", e.target.value)}
            required
          />
        </div>
      </div>
      <SubmitButton loading={loading} />
    </form>
  );

  if (variant === "plain") return formContent;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres du festival</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

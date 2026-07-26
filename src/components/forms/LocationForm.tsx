"use client";

import { useState } from "react";
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

interface LocationFormProps {
  initial?: {
    name?: string;
    type?: string;
    description?: string | null;
  };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  variant?: "card" | "plain";
}

export function LocationForm({
  initial,
  onSubmit,
  onCancel,
  variant = "card",
}: LocationFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name || "",
    type: initial?.type || "autre",
    description: initial?.description || "",
  });

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
        <Label htmlFor="name">Nom</Label>
        <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <Label>Type</Label>
        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="scene">Scène</SelectItem>
            <SelectItem value="point_de_vente">Point de vente</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
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
        <CardTitle>{initial?.name ? "Modifier le lieu" : "Nouveau lieu"}</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

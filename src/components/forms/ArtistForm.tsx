"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast-provider";

interface ArtistFormProps {
  initial?: { name?: string; phone?: string | null; description?: string | null };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  variant?: "card" | "plain";
}

export function ArtistForm({
  initial,
  onSubmit,
  onCancel,
  variant = "card",
}: ArtistFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name || "",
    phone: initial?.phone || "",
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
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
        <CardTitle>{initial?.name ? "Modifier l'artiste" : "Nouvel artiste"}</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

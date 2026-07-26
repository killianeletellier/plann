"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast-provider";

interface RoleFormProps {
  initial?: { name?: string };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  variant?: "card" | "plain";
}

export function RoleForm({
  initial,
  onSubmit,
  onCancel,
  variant = "card",
}: RoleFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initial?.name || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name });
    } catch {
      toast({ type: "error", message: "Erreur lors de l'enregistrement" });
    } finally {
      setLoading(false);
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom du rôle</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Accueil, Sécurité, Bar…"
          required
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <SubmitButton loading={loading} />
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );

  if (variant === "plain") return formContent;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial?.name ? "Modifier le rôle" : "Nouveau rôle"}</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

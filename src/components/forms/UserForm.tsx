"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast-provider";

interface UserFormProps {
  initial?: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    isAdmin?: boolean;
  };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
  variant?: "card" | "plain";
}

export function UserForm({
  initial,
  onSubmit,
  onCancel,
  isEdit,
  variant = "card",
}: UserFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: initial?.firstName || "",
    lastName: initial?.lastName || "",
    phone: initial?.phone || "",
    pin: "",
    isAdmin: initial?.isAdmin || false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        isAdmin: form.isAdmin,
      };
      if (form.pin) data.pin = form.pin;
      await onSubmit(data);
    } catch {
      toast({ type: "error", message: "Erreur lors de l'enregistrement" });
    } finally {
      setLoading(false);
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        </div>
        <div className="min-w-0">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        </div>
      </div>
      <div>
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="pin">PIN {isEdit && "(laisser vide pour conserver)"}</Label>
        <Input id="pin" type="password" inputMode="numeric" pattern="\d{4,6}" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} required={!isEdit} />
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={form.isAdmin} onCheckedChange={(v) => setForm({ ...form, isAdmin: v })} />
        <Label>Administrateur</Label>
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
        <CardTitle>{isEdit ? "Modifier le bénévole" : "Nouveau bénévole"}</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

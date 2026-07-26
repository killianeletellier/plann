"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CUSTOM_VALUE = "__custom__";
const NONE_VALUE = "__none__";

interface VolunteerRoleSelectProps {
  roles: Array<{ id: string; name: string }>;
  value?: string | null;
  onChange: (role: string | null) => void;
  id?: string;
}

export function VolunteerRoleSelect({
  roles,
  value,
  onChange,
  id,
}: VolunteerRoleSelectProps) {
  const predefinedNames = roles.map((r) => r.name);
  const isCustom = !!value && !predefinedNames.includes(value);
  const [showCustom, setShowCustom] = useState(isCustom);

  const selectValue = showCustom || isCustom
    ? CUSTOM_VALUE
    : value || NONE_VALUE;

  function handleSelectChange(v: string) {
    if (v === NONE_VALUE) {
      setShowCustom(false);
      onChange(null);
      return;
    }
    if (v === CUSTOM_VALUE) {
      setShowCustom(true);
      onChange("");
      return;
    }
    setShowCustom(false);
    onChange(v);
  }

  return (
    <div className="space-y-2">
      <Select value={selectValue} onValueChange={handleSelectChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Choisir un rôle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>Aucun rôle</SelectItem>
          {roles.map((r) => (
            <SelectItem key={r.id} value={r.name}>
              {r.name}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_VALUE}>Autre…</SelectItem>
        </SelectContent>
      </Select>
      {(showCustom || isCustom) && (
        <div>
          <Label htmlFor={id ? `${id}-custom` : undefined} className="sr-only">
            Rôle personnalisé
          </Label>
          <Input
            id={id ? `${id}-custom` : undefined}
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="Saisir un rôle"
          />
        </div>
      )}
    </div>
  );
}

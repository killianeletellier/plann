"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultMissionColor, hexColorSchema } from "@/lib/mission-color";

interface ColorPickerProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (color: string) => void;
  /** Nom utilisé pour générer une couleur par défaut si value vide */
  defaultFromName?: string;
}

export function ColorPicker({
  id = "color",
  label = "Couleur",
  value,
  onChange,
  defaultFromName,
}: ColorPickerProps) {
  const displayValue =
    value || (defaultFromName ? defaultMissionColor(defaultFromName) : "#3B82F6");

  function handleHexChange(raw: string) {
    onChange(raw.startsWith("#") ? raw : `#${raw}`);
  }

  function handleColorInputChange(raw: string) {
    onChange(raw.toUpperCase());
  }

  const isValid = hexColorSchema.safeParse(displayValue).success;

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={isValid ? displayValue : "#3B82F6"}
          onChange={(e) => handleColorInputChange(e.target.value)}
          className="h-10 w-10 shrink-0 cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
          aria-label={`${label} — sélecteur visuel`}
        />
        <Input
          value={value}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder={defaultFromName ? defaultMissionColor(defaultFromName) : "#3B82F6"}
          className="font-mono uppercase"
          maxLength={7}
        />
      </div>
      {!isValid && value ? (
        <p className="mt-1 text-xs text-red-600">Format attendu : #RGB ou #RRGGBB</p>
      ) : null}
    </div>
  );
}

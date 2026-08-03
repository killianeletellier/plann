"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast-provider";
import {
  FestivalForm,
  type FestivalFormValues,
} from "@/components/forms/FestivalForm";

export default function FestivalSettingsPage() {
  const { toast } = useToast();
  const [festival, setFestival] = useState<FestivalFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    const res = await fetch("/api/festival");
    if (res.status === 404) {
      setFestival(null);
      setNotFound(true);
      setLoading(false);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setFestival({
        name: data.name,
        code: data.code,
        startDate: data.startDate,
        endDate: data.endDate,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(data: FestivalFormValues) {
    const res = await fetch("/api/festival", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        typeof body.error === "string"
          ? body.error
          : "Erreur lors de l'enregistrement";
      toast({ type: "error", message });
      throw new Error("save failed");
    }
    toast({ type: "success", message: "Paramètres du festival enregistrés" });
    setFestival({
      name: body.name,
      code: body.code,
      startDate: body.startDate,
      endDate: body.endDate,
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (notFound || !festival) {
    return (
      <div className="space-y-4 max-w-lg">
        <h2 className="text-xl font-semibold">Paramètres du festival</h2>
        <p className="text-sm text-zinc-500 rounded-lg border border-dashed border-zinc-200 p-6 text-center">
          Aucun festival configuré en base de données. Exécutez le seed ou
          contactez un administrateur système.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h2 className="text-xl font-semibold">Paramètres du festival</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Nom, dates et code de connexion utilisés par le planning, le Gantt et
          l&apos;export PDF.
        </p>
      </div>
      <FestivalForm key={festival.code} initial={festival} onSubmit={handleSubmit} />
    </div>
  );
}

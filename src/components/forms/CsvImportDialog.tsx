"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-provider";

interface ImportResult {
  firstName: string;
  lastName: string;
  pin: string;
}

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export function CsvImportDialog({ open, onOpenChange, onImported }: CsvImportDialogProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast({ type: "error", message: "Sélectionnez un fichier CSV" });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/users/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast({ type: "error", message: data.error || "Erreur lors de l'import" });
        return;
      }

      const imported: ImportResult[] = (data.volunteers || []).map(
        (v: { user: { firstName: string; lastName: string }; pin: string }) => ({
          firstName: v.user.firstName,
          lastName: v.user.lastName,
          pin: v.pin,
        }),
      );

      setResults(imported);
      toast({
        type: "success",
        message: `${data.imported} bénévole(s) importé(s)`,
      });
      onImported();

      if (data.warnings?.length) {
        toast({ type: "error", message: data.warnings.join("; ") });
      }
    } catch {
      toast({ type: "error", message: "Erreur lors de l'import" });
    } finally {
      setLoading(false);
    }
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setResults(null);
      if (fileRef.current) fileRef.current.value = "";
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des bénévoles (CSV)</DialogTitle>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Fichier CSV avec colonnes : <strong>nom</strong>, <strong>prenom</strong>,{" "}
              <strong>telephone</strong> (optionnel). Un PIN sera généré automatiquement pour
              chaque bénévole.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-sm"
            />
            <Button onClick={handleImport} disabled={loading}>
              <Upload className="h-4 w-4 mr-1" />
              {loading ? "Import en cours…" : "Importer"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Conservez ces PIN — ils ne seront plus affichés en clair.
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
              {results.map((r) => (
                <div key={`${r.lastName}-${r.firstName}`} className="flex justify-between px-3 py-2 text-sm">
                  <span>{r.firstName} {r.lastName}</span>
                  <span className="font-mono font-medium">{r.pin}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => handleClose(false)}>Fermer</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

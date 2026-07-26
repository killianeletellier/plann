"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast-provider";
import { STABLE_BUTTON } from "@/lib/ui-stable";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  label: string;
}

export default function ExportPage() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Option[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [type, setType] = useState<"location" | "volunteer">("location");
  const [scope, setScope] = useState<"day" | "global">("global");
  const [targetId, setTargetId] = useState("");
  const [date, setDate] = useState("2026-07-11");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [locRes, userRes] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/users"),
      ]);
      if (locRes.ok) {
        const locs = await locRes.json();
        setLocations(locs.map((l: { id: string; name: string }) => ({ id: l.id, label: l.name })));
        if (locs.length) setTargetId(locs[0].id);
      }
      if (userRes.ok) {
        const u = await userRes.json();
        setUsers(u.map((x: { id: string; firstName: string; lastName: string }) => ({
          id: x.id,
          label: `${x.firstName} ${x.lastName}`,
        })));
      }
    }
    load();
  }, []);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          scope,
          targetId,
          date: scope === "day" ? date : undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `planning_${type}_${scope}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ type: "success", message: "PDF téléchargé" });
    } catch {
      toast({ type: "error", message: "Erreur lors de l'export PDF" });
    } finally {
      setLoading(false);
    }
  }

  const targets = type === "location" ? locations : users;

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="text-xl font-semibold">Export PDF</h2>
      <Card>
        <CardHeader>
          <CardTitle>Paramètres d&apos;export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Périmètre</Label>
            <Select value={type} onValueChange={(v) => {
              setType(v as "location" | "volunteer");
              setTargetId("");
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="location">Par lieu</SelectItem>
                <SelectItem value="volunteer">Par bénévole</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Période</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as "day" | "global")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Jour sélectionné</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{type === "location" ? "Lieu" : "Bénévole"}</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                {targets.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-h-[4.5rem]">
            {scope === "day" && (
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            )}
          </div>
          <Button
            onClick={handleExport}
            disabled={loading || !targetId}
            className={cn("w-full", STABLE_BUTTON)}
            aria-busy={loading}
          >
            {loading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

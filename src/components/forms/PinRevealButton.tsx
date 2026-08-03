"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-provider";

interface PinRevealButtonProps {
  userId: string;
  userName: string;
}

export function PinRevealButton({ userId, userName }: PinRevealButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function revealPin() {
    setLoading(true);
    setPin(null);
    try {
      const res = await fetch(`/api/users/${userId}/pin`);
      const data = await res.json();
      if (!res.ok) {
        toast({ type: "error", message: data.error || "PIN non disponible" });
        setOpen(false);
        return;
      }
      setPin(data.pin);
    } catch {
      toast({ type: "error", message: "Erreur lors de la récupération du PIN" });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      revealPin();
    } else {
      setPin(null);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        title="Voir le PIN"
        onClick={() => handleOpenChange(true)}
      >
        <KeyRound className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>PIN de {userName}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <p className="text-sm text-zinc-500">Chargement…</p>
          ) : pin ? (
            <p className="text-center text-3xl font-mono font-bold tracking-widest">{pin}</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

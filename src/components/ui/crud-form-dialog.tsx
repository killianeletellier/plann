"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CrudFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function CrudFormDialog({
  open,
  onOpenChange,
  title,
  children,
}: CrudFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-zinc-200 px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="min-w-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

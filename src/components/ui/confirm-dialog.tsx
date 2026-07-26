"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message = "",
  confirmLabel,
  cancelLabel,
  variant,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();
  const showMessage =
    trimmedMessage.length > 0 && trimmedMessage !== trimmedTitle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="shrink-0 border-b border-zinc-200 px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {showMessage && (
          <div className="px-6 py-4">
            <p className="text-sm text-zinc-600">{message}</p>
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-zinc-200 px-6 py-4">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

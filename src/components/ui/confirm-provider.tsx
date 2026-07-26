"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const DEFAULT_CONFIRM_LABEL = "Confirmer";
const DEFAULT_CANCEL_LABEL = "Annuler";

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    setOpen(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
      setOpen(true);
    });
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) settle(false);
    },
    [settle],
  );

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options && (
        <ConfirmDialog
          open={open}
          onOpenChange={handleOpenChange}
          title={options.title}
          message={options.message ?? ""}
          confirmLabel={options.confirmLabel ?? DEFAULT_CONFIRM_LABEL}
          cancelLabel={options.cancelLabel ?? DEFAULT_CANCEL_LABEL}
          variant={options.variant ?? "destructive"}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx;
}

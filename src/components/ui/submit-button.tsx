"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { STABLE_BUTTON } from "@/lib/ui-stable";
import { cn } from "@/lib/utils";

interface SubmitButtonProps extends ButtonProps {
  loading?: boolean;
  loadingLabel?: string;
}

export function SubmitButton({
  loading = false,
  loadingLabel,
  children = "Enregistrer",
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || loading}
      className={cn(STABLE_BUTTON, className)}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner className="h-4 w-4" />
          <span className="sr-only">{loadingLabel ?? "Chargement"}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}

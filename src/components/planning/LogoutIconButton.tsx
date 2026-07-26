"use client";

import { LogOut } from "lucide-react";

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

export function LogoutIconButton() {
  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Déconnexion"
      title="Déconnexion"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}

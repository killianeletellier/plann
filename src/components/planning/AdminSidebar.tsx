"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Download,
  LayoutDashboard,
  MapPin,
  Music,
  Sparkles,
  ClipboardList,
  Briefcase,
  Users,
  UserCog,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

const navItems = [
  { href: "/admin", label: "Carte", icon: LayoutDashboard },
  { href: "/admin/planning", label: "Planning", icon: Calendar },
  { href: "/admin/lieux", label: "Lieux", icon: MapPin },
  { href: "/admin/benevoles", label: "Bénévoles", icon: Users },
  { href: "/admin/roles", label: "Rôles", icon: UserCog },
  { href: "/admin/artistes", label: "Artistes", icon: Music },
  { href: "/admin/animations", label: "Animations", icon: Sparkles },
  { href: "/admin/taches", label: "Tâches", icon: ClipboardList },
  { href: "/admin/postes", label: "Postes", icon: Briefcase },
  { href: "/admin/export", label: "Export PDF", icon: Download },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-zinc-200 bg-zinc-50 min-h-screen shrink-0">
      <div className="p-4 border-b border-zinc-200">
        <h1 className="font-bold text-lg text-zinc-900">PLANN Admin</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-11",
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-200",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-zinc-200">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  const mobileItems = navItems.slice(0, 4);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white">
      <div className="flex justify-around">
        {mobileItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center min-h-[56px] min-w-[64px] justify-center text-xs",
                active ? "text-zinc-900 font-medium" : "text-zinc-500",
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

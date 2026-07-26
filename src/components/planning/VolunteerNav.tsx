"use client";

import { usePathname } from "next/navigation";
import { Calendar, Home, Users } from "lucide-react";
import { VolunteerNavItem } from "@/components/planning/VolunteerNavItem";

const navItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/planning", label: "Planning", icon: Calendar },
  { href: "/annuaire", label: "Annuaire", icon: Users },
];

export function VolunteerNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white safe-area-pb">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map(({ href, label, icon }) => (
          <VolunteerNavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href}
          />
        ))}
      </div>
    </nav>
  );
}

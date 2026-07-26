"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const volunteerNavItemClass =
  "flex flex-col items-center justify-center min-h-[56px] min-w-[72px] px-3 py-2 text-xs font-medium transition-colors";

type VolunteerNavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

export function VolunteerNavItem({
  href,
  label,
  icon: Icon,
  active,
}: VolunteerNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        volunteerNavItemClass,
        active ? "text-zinc-900" : "text-zinc-500",
      )}
    >
      <Icon className="h-6 w-6 mb-1" />
      {label}
    </Link>
  );
}

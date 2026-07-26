import { LogoutIconButton } from "@/components/planning/LogoutIconButton";
import { VolunteerNav } from "@/components/planning/VolunteerNav";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.isAdmin) redirect("/admin");

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-zinc-500">Bonjour</p>
            <h1 className="truncate font-semibold text-lg">
              {session.firstName} {session.lastName}
            </h1>
          </div>
          <LogoutIconButton />
        </div>
      </header>
      <main className="px-4 py-4 max-w-lg mx-auto">{children}</main>
      <VolunteerNav />
    </div>
  );
}

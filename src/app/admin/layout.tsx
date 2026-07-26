import { AdminMobileNav, AdminSidebar } from "@/components/planning/AdminSidebar";
import { LogoutIconButton } from "@/components/planning/LogoutIconButton";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/");

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 border-b border-zinc-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-bold text-lg">PLANN Admin</h1>
            <LogoutIconButton />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto">{children}</main>
        <AdminMobileNav />
      </div>
    </div>
  );
}

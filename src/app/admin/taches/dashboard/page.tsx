import { redirect } from "next/navigation";

export default function TaskDashboardRedirect() {
  redirect("/admin/taches");
}

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { adminGetStats, adminGetPromoCodes, adminGetTickets } from "@/lib/actions"
import AdminDashboard from "@/components/admin/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (!session?.value || session.value !== "admin-nathigean-001") {
    redirect("/admin/login")
  }

  const [stats, codes, tickets] = await Promise.all([
    adminGetStats(),
    adminGetPromoCodes(),
    adminGetTickets(),
  ])

  return <AdminDashboard stats={stats} codes={codes} tickets={tickets} />
}

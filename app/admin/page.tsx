import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { adminGetStats, adminGetPromoCodes, adminGetTickets, getSaasConfig, adminGetLogs } from "@/lib/actions"
import AdminDashboard from "@/components/admin/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  const adminSecret = process.env.ADMIN_SECRET

  // Sem ADMIN_SECRET configurado no ambiente, bloqueia por segurança
  if (!adminSecret || session?.value !== adminSecret) {
    redirect("/admin/login")
  }

  const [stats, codes, tickets, saasConfigData, logs] = await Promise.all([
    adminGetStats(),
    adminGetPromoCodes(),
    adminGetTickets(),
    getSaasConfig(),
    adminGetLogs(500),
  ])

  return <AdminDashboard stats={stats} codes={codes} tickets={tickets} initialSaasConfig={saasConfigData} initialLogs={logs} />
}

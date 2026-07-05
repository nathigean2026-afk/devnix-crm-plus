import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { adminGetStats, adminGetPromoCodes, adminGetTickets, getSaasConfig } from "@/lib/actions"
import AdminDashboard from "@/components/admin/admin-dashboard"

export const dynamic = "force-dynamic"

const ADMIN_TOKEN = "admin-nathigean-001"

export default async function AdminPage(props: { searchParams?: Promise<{ t?: string }> }) {
  const searchParams = await (props.searchParams ?? Promise.resolve({}))
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  const queryToken = searchParams?.t

  // Aceita via cookie OU via query string (fallback para iframe/preview)
  const isAuthorized =
    session?.value === ADMIN_TOKEN || queryToken === ADMIN_TOKEN

  if (!isAuthorized) {
    redirect("/admin/login")
  }

  const [stats, codes, tickets, saasConfigData] = await Promise.all([
    adminGetStats(),
    adminGetPromoCodes(),
    adminGetTickets(),
    getSaasConfig(),
  ])

  return <AdminDashboard stats={stats} codes={codes} tickets={tickets} initialSaasConfig={saasConfigData} />
}

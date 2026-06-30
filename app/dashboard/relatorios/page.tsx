import { getReportData, getMyPermissions } from "@/lib/actions"
import { ReportsView } from "@/components/relatorios/reports-view"
import { AccessDenied } from "@/components/dashboard/access-denied"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Relatórios" }

export default async function RelatoriosPage() {
  const perms = await getMyPermissions()
  if (perms && !perms.canRelatorios) {
    return <AccessDenied module="Relatórios" />
  }

  const data = await getReportData()
  return <ReportsView data={data} />
}

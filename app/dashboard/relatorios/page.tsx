import { getReportData, getMyPermissions } from "@/lib/actions"
import { ReportsView } from "@/components/relatorios/reports-view"
import { AccessDenied } from "@/components/dashboard/access-denied"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Relatórios" }

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const perms = await getMyPermissions()
  if (perms && !perms.canRelatorios) {
    return <AccessDenied module="Relatórios" />
  }

  const { days } = await searchParams
  const daysNum = days ? Math.max(1, Math.min(365, parseInt(days, 10) || 30)) : 30
  const data = await getReportData(daysNum)
  return <ReportsView data={data} />
}

import { getReportData } from "@/lib/actions"
import { ReportsView } from "@/components/relatorios/reports-view"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Relatórios" }

export default async function RelatoriosPage() {
  const data = await getReportData()
  return <ReportsView data={data} />
}

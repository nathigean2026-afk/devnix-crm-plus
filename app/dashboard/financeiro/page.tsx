import { getTransactions, getClients, getMyPermissions } from "@/lib/actions"
import { FinanceView } from "@/components/financeiro/finance-view"
import { AccessDenied } from "@/components/dashboard/access-denied"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Financeiro" }

export default async function FinanceiroPage() {
  const perms = await getMyPermissions()
  if (perms && !perms.canFinanceiro) {
    return <AccessDenied module="Financeiro" />
  }

  const [transactions, clients] = await Promise.all([
    getTransactions(),
    getClients(),
  ])
  return <FinanceView initialTransactions={transactions} clients={clients} />
}

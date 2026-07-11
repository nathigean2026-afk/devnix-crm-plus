import { getTransactions, getClients, getMyPermissions, getServiceOrders } from "@/lib/actions"
import { FinanceView } from "@/components/financeiro/finance-view"
import { AccessDenied } from "@/components/dashboard/access-denied"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Financeiro" }

export default async function FinanceiroPage() {
  const perms = await getMyPermissions()
  if (perms && !perms.canFinanceiro) {
    return <AccessDenied module="Financeiro" />
  }

  const [transactions, clients, allOrders] = await Promise.all([
    getTransactions(),
    getClients(),
    getServiceOrders(),
  ])

  // OS pendentes de recebimento: concluídas com paymentStatus pendente
  const pendingOrders = allOrders.filter(
    o => o.status === "concluido" && o.paymentStatus !== "pago"
  )

  return <FinanceView initialTransactions={transactions} clients={clients} pendingOrders={pendingOrders} />
}

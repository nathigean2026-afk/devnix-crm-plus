import { getTransactions, getClients } from "@/lib/actions"
import { FinanceView } from "@/components/financeiro/finance-view"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Financeiro" }

export default async function FinanceiroPage() {
  const [transactions, clients] = await Promise.all([
    getTransactions(),
    getClients(),
  ])
  return <FinanceView initialTransactions={transactions} clients={clients} />
}

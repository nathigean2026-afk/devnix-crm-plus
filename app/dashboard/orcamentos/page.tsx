import { getQuotes, getClients, getServices } from "@/lib/actions"
import { QuotesView } from "@/components/orcamentos/quotes-view"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Orçamentos" }

export default async function OrcamentosPage() {
  const [quotes, clients, services] = await Promise.all([
    getQuotes(),
    getClients(),
    getServices(),
  ])
  return <QuotesView initialQuotes={quotes} clients={clients} services={services} />
}

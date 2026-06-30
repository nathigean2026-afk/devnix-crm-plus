import { getQuotes, getClients, getServices, getMyPermissions } from "@/lib/actions"
import { QuotesView } from "@/components/orcamentos/quotes-view"
import { AccessDenied } from "@/components/dashboard/access-denied"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Orçamentos" }

export default async function OrcamentosPage() {
  const perms = await getMyPermissions()
  if (perms && !perms.canQuotes) {
    return <AccessDenied module="Orçamentos" />
  }

  const [quotes, clients, services] = await Promise.all([
    getQuotes(),
    getClients(),
    getServices(),
  ])
  return <QuotesView initialQuotes={quotes} clients={clients} services={services} />
}

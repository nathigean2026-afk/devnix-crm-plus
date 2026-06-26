import { getSupportTickets } from "@/lib/actions"
import { SuporteView } from "@/components/support/suporte-view"

export const metadata = { title: "Suporte | Devnix CRM Plus" }

export default async function SuportePage() {
  const tickets = await getSupportTickets()
  return <SuporteView tickets={tickets} />
}

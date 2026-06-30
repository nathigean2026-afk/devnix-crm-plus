import { getClients, getMyPermissions } from "@/lib/actions"
import { ClientsTable } from "@/components/clientes/clients-table"
import { AccessDenied } from "@/components/dashboard/access-denied"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Clientes" }

export default async function ClientesPage() {
  const perms = await getMyPermissions()
  if (perms && !perms.canClients) {
    return <AccessDenied module="Clientes" />
  }

  const clients = await getClients()
  return <ClientsTable initialClients={clients} />
}

import { getClients } from "@/lib/actions"
import { ClientsTable } from "@/components/clientes/clients-table"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Clientes" }

export default async function ClientesPage() {
  const clients = await getClients()
  return <ClientsTable initialClients={clients} />
}

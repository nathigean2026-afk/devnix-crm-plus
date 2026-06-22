import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getServiceOrders, getClients, getServices } from "@/lib/actions"
import { ServiceOrdersView } from "@/components/ordens-servico/service-orders-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ordens de Serviço",
}

export default async function ServiceOrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const [orders, clients, services] = await Promise.all([
    getServiceOrders(),
    getClients(),
    getServices(),
  ])

  return (
    <ServiceOrdersView
      initialOrders={orders}
      clients={clients}
      services={services}
    />
  )
}

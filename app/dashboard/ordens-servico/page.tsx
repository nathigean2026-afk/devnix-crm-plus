import { getServiceOrders, getClients, getServices, getMyPermissions } from "@/lib/actions"
import { ServiceOrdersView } from "@/components/ordens-servico/service-orders-view"
import { AccessDenied } from "@/components/dashboard/access-denied"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ordens de Serviço",
}

export default async function ServiceOrdersPage() {
  const perms = await getMyPermissions()
  if (perms && !perms.canOrders) {
    return <AccessDenied module="Ordens de Serviço" />
  }

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

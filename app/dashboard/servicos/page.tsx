import { getServices, getMyPermissions } from "@/lib/actions"
import { ServicesTable } from "@/components/servicos/services-table"
import { AccessDenied } from "@/components/dashboard/access-denied"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Serviços" }

export default async function ServicosPage() {
  const perms = await getMyPermissions()
  if (perms && !perms.canServices) {
    return <AccessDenied module="Serviços" />
  }

  const services = await getServices()
  return <ServicesTable initialServices={services} />
}

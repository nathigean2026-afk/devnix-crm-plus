import { getServices } from "@/lib/actions"
import { ServicesTable } from "@/components/servicos/services-table"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Serviços" }

export default async function ServicosPage() {
  const services = await getServices()
  return <ServicesTable initialServices={services} />
}

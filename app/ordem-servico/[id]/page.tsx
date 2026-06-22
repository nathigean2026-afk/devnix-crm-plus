import { getServiceOrderWithItems } from "@/lib/actions"
import { notFound } from "next/navigation"
import { PublicServiceOrderView } from "@/components/ordens-servico/public-service-order-view"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const order = await getServiceOrderWithItems(id)
  if (!order) return { title: "Ordem de Serviço não encontrada" }
  return {
    title: `OS #${String(order.number).padStart(4, "0")} — ${order.title}`,
  }
}

export default async function PublicServiceOrderPage({ params }: Props) {
  const { id } = await params
  const order = await getServiceOrderWithItems(id)
  if (!order) notFound()

  return <PublicServiceOrderView order={order} />
}

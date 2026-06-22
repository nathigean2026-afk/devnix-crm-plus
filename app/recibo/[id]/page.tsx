import { getServiceOrderForReceipt } from "@/lib/actions"
import { notFound } from "next/navigation"
import { PublicReceiptView } from "@/components/ordens-servico/public-receipt-view"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReciboPage({ params }: Props) {
  const { id } = await params
  const data = await getServiceOrderForReceipt(id)
  if (!data) notFound()
  return <PublicReceiptView order={data} />
}

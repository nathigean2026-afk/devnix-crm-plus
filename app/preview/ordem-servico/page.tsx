import { db } from "@/lib/db"
import { businessProfile } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { PublicServiceOrderView } from "@/components/ordens-servico/public-service-order-view"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Preview — Ordem de Serviço" }

export default async function PreviewOrdemServicoPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string }>
}) {
  const { uid } = await searchParams

  const profile = uid
    ? (await db.select().from(businessProfile).where(eq(businessProfile.userId, uid)).limit(1))[0] ?? null
    : null

  const fakeOrder = {
    id: "preview-os",
    userId: uid ?? "preview",
    clientId: "preview-client",
    quoteId: null,
    number: 17,
    title: "Manutenção e Instalação Elétrica Residencial",
    status: "em-andamento",
    pixKey: profile?.pixKey ?? "11.000.111/0001-00",
    pixType: profile?.pixType ?? "cnpj",
    subtotal: "2400.00",
    discount: "150.00",
    discountType: "valor",
    discountExpiry: null,
    total: "2250.00",
    cashPrice: "2137.50",
    cardPrice: "2362.50",
    cardInstallments: 6,
    notes: "Serviço inclui material elétrico e mão de obra. Garantia de 90 dias.",
    internalNotes: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: "os-item-1",
        serviceOrderId: "preview-os",
        serviceId: null,
        description: "Troca de quadro de distribuição",
        quantity: "1",
        unitPrice: "900.00",
        total: "900.00",
        createdAt: new Date(),
      },
      {
        id: "os-item-2",
        serviceOrderId: "preview-os",
        serviceId: null,
        description: "Instalação de tomadas (12 pontos)",
        quantity: "12",
        unitPrice: "80.00",
        total: "960.00",
        createdAt: new Date(),
      },
      {
        id: "os-item-3",
        serviceOrderId: "preview-os",
        serviceId: null,
        description: "Revisão geral da instalação",
        quantity: "1",
        unitPrice: "540.00",
        total: "540.00",
        createdAt: new Date(),
      },
    ],
    client: {
      id: "preview-client",
      userId: uid ?? "preview",
      name: "Carlos Ferreira",
      email: "carlos@exemplo.com.br",
      phone: "(41) 98877-6655",
      company: null,
      document: "987.654.321-00",
      address: "Av. das Palmeiras, 543",
      city: "Curitiba",
      state: "PR",
      notes: null,
      birthdate: null,
      status: "ativo",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    profile: profile,
  }

  return <PublicServiceOrderView order={fakeOrder as never} />
}

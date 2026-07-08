import { db } from "@/lib/db"
import { businessProfile } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { PublicQuoteView } from "@/components/orcamentos/public-quote-view"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Preview — Orçamento" }

export default async function PreviewOrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string }>
}) {
  const { uid } = await searchParams

  const profile = uid
    ? (await db.select().from(businessProfile).where(eq(businessProfile.userId, uid)).limit(1))[0] ?? null
    : null

  // Dados fictícios — refletem o layout real mas sem informações reais de clientes
  const fakeQuote = {
    id: "preview",
    userId: uid ?? "preview",
    clientId: "preview-client",
    number: 42,
    title: "Desenvolvimento de Site Institucional",
    status: "enviado",
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    notes: "Prazo de entrega estimado: 15 dias úteis após aprovação. Inclui 2 rodadas de revisão.",
    internalNotes: null,
    rejectionReason: null,
    respondedAt: null,
    subtotal: "3800.00",
    discount: "300.00",
    total: "3500.00",
    cashPrice: "3325.00",
    cardPrice: "3675.00",
    cardInstallments: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const fakeClient = {
    id: "preview-client",
    userId: uid ?? "preview",
    name: "Maria Oliveira",
    email: "maria@exemplo.com.br",
    phone: "(11) 99888-7766",
    company: "MO Consultoria",
    document: "123.456.789-00",
    address: "Rua das Flores, 200",
    city: "São Paulo",
    state: "SP",
    notes: null,
    birthdate: null,
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const fakeItems = [
    {
      id: "item-1",
      quoteId: "preview",
      serviceId: null,
      description: "Criação de layout e identidade visual",
      quantity: "1",
      unitPrice: "1200.00",
      total: "1200.00",
      createdAt: new Date(),
    },
    {
      id: "item-2",
      quoteId: "preview",
      serviceId: null,
      description: "Desenvolvimento front-end (HTML/CSS/JS)",
      quantity: "1",
      unitPrice: "1800.00",
      total: "1800.00",
      createdAt: new Date(),
    },
    {
      id: "item-3",
      quoteId: "preview",
      serviceId: null,
      description: "Configuração de hospedagem e domínio",
      quantity: "1",
      unitPrice: "800.00",
      total: "800.00",
      createdAt: new Date(),
    },
  ]

  return (
    <PublicQuoteView
      quote={fakeQuote as never}
      client={fakeClient}
      items={fakeItems as never}
      providerPhone={profile?.phone ?? null}
      profile={profile}
    />
  )
}

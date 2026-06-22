import { db } from "@/lib/db"
import { clients, quoteItems, quotes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { PublicQuoteView } from "@/components/orcamentos/public-quote-view"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const quote = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1)
  if (!quote[0]) return { title: "Orçamento não encontrado" }
  return { title: `Orçamento #${String(quote[0].number).padStart(4, "0")} — ${quote[0].title}` }
}

export default async function PublicQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1)
  if (!quote[0]) notFound()

  const [client, items] = await Promise.all([
    db.select().from(clients).where(eq(clients.id, quote[0].clientId)).limit(1),
    db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)),
  ])

  return <PublicQuoteView quote={quote[0]} client={client[0] ?? null} items={items} />
}

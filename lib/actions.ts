"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  clients,
  quoteItems,
  quotes,
  services,
  transactions,
} from "@/lib/db/schema"
import { and, desc, eq, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Não autorizado")
  return session.user.id
}

// ── Clients ──────────────────────────────────────────────────────────────────
export async function getClients() {
  const userId = await getUserId()
  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(desc(clients.createdAt))
}

export async function createClient(data: {
  name: string
  email?: string
  phone?: string
  company?: string
  document?: string
  address?: string
  city?: string
  state?: string
  notes?: string
}) {
  const userId = await getUserId()
  await db.insert(clients).values({
    id: crypto.randomUUID(),
    userId,
    ...data,
  })
  revalidatePath("/dashboard/clientes")
}

export async function updateClient(
  id: string,
  data: Partial<{
    name: string
    email: string
    phone: string
    company: string
    document: string
    address: string
    city: string
    state: string
    notes: string
    status: string
  }>
) {
  const userId = await getUserId()
  await db
    .update(clients)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
  revalidatePath("/dashboard/clientes")
}

export async function deleteClient(id: string) {
  const userId = await getUserId()
  await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
  revalidatePath("/dashboard/clientes")
}

// ── Services ─────────────────────────────────────────────────────────────────
export async function getServices() {
  const userId = await getUserId()
  return db
    .select()
    .from(services)
    .where(eq(services.userId, userId))
    .orderBy(desc(services.createdAt))
}

export async function createService(data: {
  name: string
  description?: string
  price: string
  unit?: string
  category?: string
}) {
  const userId = await getUserId()
  await db.insert(services).values({
    id: crypto.randomUUID(),
    userId,
    ...data,
  })
  revalidatePath("/dashboard/servicos")
}

export async function updateService(
  id: string,
  data: Partial<{
    name: string
    description: string
    price: string
    unit: string
    category: string
    active: boolean
  }>
) {
  const userId = await getUserId()
  await db
    .update(services)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(services.id, id), eq(services.userId, userId)))
  revalidatePath("/dashboard/servicos")
}

export async function deleteService(id: string) {
  const userId = await getUserId()
  await db
    .delete(services)
    .where(and(eq(services.id, id), eq(services.userId, userId)))
  revalidatePath("/dashboard/servicos")
}

// ── Quotes ───────────────────────────────────────────────────────────────────
export async function getQuotes() {
  const userId = await getUserId()
  return db
    .select()
    .from(quotes)
    .where(eq(quotes.userId, userId))
    .orderBy(desc(quotes.createdAt))
}

export async function getNextQuoteNumber(userId: string) {
  const result = await db
    .select({ max: sql<number>`COALESCE(MAX(number), 0)` })
    .from(quotes)
    .where(eq(quotes.userId, userId))
  return (result[0]?.max ?? 0) + 1
}

export async function createQuote(data: {
  clientId: string
  title: string
  validUntil?: string
  notes?: string
  internalNotes?: string
  subtotal: string
  discount: string
  total: string
  items: {
    serviceId?: string
    description: string
    quantity: string
    unitPrice: string
    total: string
  }[]
}) {
  const userId = await getUserId()
  const number = await getNextQuoteNumber(userId)
  const quoteId = crypto.randomUUID()

  await db.insert(quotes).values({
    id: quoteId,
    userId,
    clientId: data.clientId,
    number,
    title: data.title,
    validUntil: data.validUntil,
    notes: data.notes,
    internalNotes: data.internalNotes,
    subtotal: data.subtotal,
    discount: data.discount,
    total: data.total,
  })

  if (data.items.length > 0) {
    await db.insert(quoteItems).values(
      data.items.map((item) => ({
        id: crypto.randomUUID(),
        quoteId,
        ...item,
      }))
    )
  }

  revalidatePath("/dashboard/orcamentos")
  return quoteId
}

export async function updateQuoteStatus(id: string, status: string) {
  const userId = await getUserId()
  await db
    .update(quotes)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
  revalidatePath("/dashboard/orcamentos")
}

export async function deleteQuote(id: string) {
  const userId = await getUserId()
  await db
    .delete(quoteItems)
    .where(eq(quoteItems.quoteId, id))
  await db
    .delete(quotes)
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
  revalidatePath("/dashboard/orcamentos")
}

export async function getQuoteWithItems(id: string) {
  const userId = await getUserId()
  const quote = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
    .limit(1)
  if (!quote[0]) return null

  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, id))

  return { ...quote[0], items }
}

// ── Transactions ──────────────────────────────────────────────────────────────
export async function getTransactions() {
  const userId = await getUserId()
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
}

export async function createTransaction(data: {
  clientId?: string
  quoteId?: string
  type: string
  description: string
  amount: string
  category?: string
  dueDate?: string
  status?: string
}) {
  const userId = await getUserId()
  await db.insert(transactions).values({
    id: crypto.randomUUID(),
    userId,
    ...data,
  })
  revalidatePath("/dashboard/financeiro")
}

export async function updateTransaction(
  id: string,
  data: Partial<{
    description: string
    amount: string
    category: string
    dueDate: string
    paidAt: string
    status: string
  }>
) {
  const userId = await getUserId()
  await db
    .update(transactions)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
  revalidatePath("/dashboard/financeiro")
}

export async function deleteTransaction(id: string) {
  const userId = await getUserId()
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
  revalidatePath("/dashboard/financeiro")
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const userId = await getUserId()

  const [
    totalClientsResult,
    activeClientsResult,
    totalQuotesResult,
    pendingQuotesResult,
    approvedQuotesResult,
    revenueResult,
    pendingRevenueResult,
    expensesResult,
    recentClients,
    recentQuotes,
  ] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(clients).where(eq(clients.userId, userId)),
    db.select({ count: sql<number>`COUNT(*)` }).from(clients).where(and(eq(clients.userId, userId), eq(clients.status, "ativo"))),
    db.select({ count: sql<number>`COUNT(*)` }).from(quotes).where(eq(quotes.userId, userId)),
    db.select({ count: sql<number>`COUNT(*)` }).from(quotes).where(and(eq(quotes.userId, userId), eq(quotes.status, "enviado"))),
    db.select({ count: sql<number>`COUNT(*)` }).from(quotes).where(and(eq(quotes.userId, userId), eq(quotes.status, "aprovado"))),
    db.select({ sum: sql<string>`COALESCE(SUM(amount), 0)` }).from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.type, "receita"), eq(transactions.status, "pago"))),
    db.select({ sum: sql<string>`COALESCE(SUM(amount), 0)` }).from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.type, "receita"), eq(transactions.status, "pendente"))),
    db.select({ sum: sql<string>`COALESCE(SUM(amount), 0)` }).from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.type, "despesa"), eq(transactions.status, "pago"))),
    db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt)).limit(5),
    db.select().from(quotes).where(eq(quotes.userId, userId)).orderBy(desc(quotes.createdAt)).limit(5),
  ])

  return {
    totalClients: Number(totalClientsResult[0]?.count ?? 0),
    activeClients: Number(activeClientsResult[0]?.count ?? 0),
    totalQuotes: Number(totalQuotesResult[0]?.count ?? 0),
    pendingQuotes: Number(pendingQuotesResult[0]?.count ?? 0),
    approvedQuotes: Number(approvedQuotesResult[0]?.count ?? 0),
    revenue: Number(revenueResult[0]?.sum ?? 0),
    pendingRevenue: Number(pendingRevenueResult[0]?.sum ?? 0),
    expenses: Number(expensesResult[0]?.sum ?? 0),
    recentClients,
    recentQuotes,
  }
}

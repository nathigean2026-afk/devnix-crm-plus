"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  businessProfile,
  clients,
  quoteItems,
  quotes,
  serviceOrderItems,
  serviceOrders,
  services,
  transactions,
  user,
} from "@/lib/db/schema"
import { and, desc, eq, like, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Não autorizado")
  return session.user.id
}

// ── Licenca ───────────────────────────────────────────────────────────────────

export async function getUserLicense() {
  const userId = await getUserId()
  const [u] = await db
    .select({ accessExpiresAt: user.accessExpiresAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  const now = new Date()
  const expiresAt = u?.accessExpiresAt ?? null
  const isActive = expiresAt ? expiresAt > now : false
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  return { isActive, expiresAt, daysLeft }
}

export async function activateLicense(plan: "7d" | "30d" | "1y") {
  const userId = await getUserId()
  const now = new Date()
  const expiresAt = new Date(now)
  if (plan === "7d") expiresAt.setDate(expiresAt.getDate() + 7)
  else if (plan === "30d") expiresAt.setDate(expiresAt.getDate() + 30)
  else expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  await db.update(user).set({ accessExpiresAt: expiresAt }).where(eq(user.id, userId))
  revalidatePath("/dashboard")
  redirect("/dashboard")
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
    validUntil: data.validUntil || undefined,
    notes: data.notes || undefined,
    internalNotes: data.internalNotes || undefined,
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

/**
 * Ação pública — chamada pelo cliente via página /orcamento/[id]
 * Não requer sessão; o ID do orçamento é o token de acesso.
 * Se aprovado: cria OS automaticamente copiando itens do orçamento.
 * Se recusado: salva o motivo informado pelo cliente.
 */
export async function respondQuote(
  id: string,
  decision: "aprovado" | "recusado",
  rejectionReason?: string
): Promise<{ success: boolean; serviceOrderId?: string; error?: string }> {
  try {
    // Busca orçamento sem autenticação (público)
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1)
    if (!quote) return { success: false, error: "Orçamento não encontrado." }
    if (quote.status !== "enviado") return { success: false, error: "Este orçamento não está disponível para resposta." }

    await db
      .update(quotes)
      .set({
        status: decision,
        rejectionReason: decision === "recusado" ? (rejectionReason ?? null) : null,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, id))

    revalidatePath(`/orcamento/${id}`)
    revalidatePath("/dashboard/orcamentos")
    revalidatePath("/dashboard/relatorios")

    if (decision === "aprovado") {
      // Cria OS automaticamente a partir do orçamento aprovado
      const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, id))
      const number = await getNextServiceOrderNumber(quote.userId)
      const orderId = crypto.randomUUID()

      await db.insert(serviceOrders).values({
        id: orderId,
        userId: quote.userId,
        clientId: quote.clientId,
        quoteId: id,
        number,
        title: quote.title,
        status: "aberto",
        subtotal: quote.subtotal,
        discount: quote.discount,
        total: quote.total,
        notes: quote.notes ?? undefined,
        internalNotes: quote.internalNotes ?? undefined,
      })

      if (items.length > 0) {
        await db.insert(serviceOrderItems).values(
          items.map((item) => ({
            id: crypto.randomUUID(),
            serviceOrderId: orderId,
            serviceId: item.serviceId ?? undefined,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          }))
        )
      }

      revalidatePath("/dashboard/ordens-servico")
      return { success: true, serviceOrderId: orderId }
    }

    return { success: true }
  } catch (e) {
    console.error("[v0] respondQuote error:", e)
    return { success: false, error: "Erro interno. Tente novamente." }
  }
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
    clientId: data.clientId || undefined,
    quoteId: data.quoteId || undefined,
    type: data.type,
    description: data.description,
    amount: data.amount,
    category: data.category || undefined,
    dueDate: data.dueDate || undefined,
    status: data.status || "pendente",
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

// ── Business Profile ──────────────────────────────────────────────────────────
export async function getBusinessProfile() {
  const userId = await getUserId()
  const rows = await db.select().from(businessProfile).where(eq(businessProfile.userId, userId)).limit(1)
  return rows[0] ?? null
}

export async function upsertBusinessProfile(data: {
  name?: string
  document?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  website?: string
  pixKey?: string
  pixType?: string
  logo?: string
}) {
  const userId = await getUserId()
  const existing = await db.select({ id: businessProfile.id }).from(businessProfile).where(eq(businessProfile.userId, userId)).limit(1)
  if (existing[0]) {
    await db.update(businessProfile).set({ ...data, updatedAt: new Date() }).where(eq(businessProfile.userId, userId))
  } else {
    await db.insert(businessProfile).values({ id: crypto.randomUUID(), userId, name: data.name ?? "", ...data })
  }
  revalidatePath("/dashboard/configuracoes")
}

// ── Service Orders ────────────────────────────────────────────────────────────
export async function getServiceOrders() {
  const userId = await getUserId()
  return db.select().from(serviceOrders).where(eq(serviceOrders.userId, userId)).orderBy(desc(serviceOrders.createdAt))
}

export async function getNextServiceOrderNumber(userId: string) {
  const result = await db.select({ max: sql<number>`COALESCE(MAX(number), 0)` }).from(serviceOrders).where(eq(serviceOrders.userId, userId))
  return (result[0]?.max ?? 0) + 1
}

export async function createServiceOrder(data: {
  clientId: string
  quoteId?: string
  title: string
  pixKey?: string
  pixType?: string
  subtotal: string
  discount: string
  discountType?: string
  discountExpiry?: string
  total: string
  cashPrice?: string
  cardPrice?: string
  cardInstallments?: number
  notes?: string
  internalNotes?: string
  items: { serviceId?: string; description: string; quantity: string; unitPrice: string; total: string }[]
}) {
  const userId = await getUserId()
  const number = await getNextServiceOrderNumber(userId)
  const orderId = crypto.randomUUID()

  await db.insert(serviceOrders).values({
    id: orderId,
    userId,
    clientId: data.clientId,
    quoteId: data.quoteId,
    number,
    title: data.title,
    pixKey: data.pixKey || undefined,
    pixType: data.pixType || undefined,
    subtotal: data.subtotal,
    discount: data.discount,
    discountType: data.discountType || undefined,
    discountExpiry: data.discountExpiry || undefined,
    total: data.total,
    cashPrice: data.cashPrice || undefined,
    cardPrice: data.cardPrice || undefined,
    cardInstallments: data.cardInstallments || undefined,
    notes: data.notes || undefined,
    internalNotes: data.internalNotes || undefined,
  })

  if (data.items.length > 0) {
    await db.insert(serviceOrderItems).values(data.items.map(item => ({ id: crypto.randomUUID(), serviceOrderId: orderId, ...item })))
  }

  revalidatePath("/dashboard/ordens-servico")
  return orderId
}

export async function updateServiceOrderStatus(
  id: string,
  status: string,
  paymentMethod?: "cash" | "card" | "other"
) {
  const userId = await getUserId()
  await db
    .update(serviceOrders)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "concluido" ? { completedAt: new Date() } : {}),
    })
    .where(and(eq(serviceOrders.id, id), eq(serviceOrders.userId, userId)))

  // Auto-lançamento financeiro ao concluir OS
  if (status === "concluido") {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id)).limit(1)
    if (order && Number(order.total) > 0) {
      // Anti-duplicata: verifica se já existe lançamento para esta OS
      const existing = await db
        .select({ id: transactions.id })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            like(transactions.description, `OS #${String(order.number).padStart(4, "0")} —%`)
          )
        )
        .limit(1)

      if (existing.length === 0) {
        // Determina valor com base na forma de pagamento escolhida
        let amountToRecord = order.total
        if (paymentMethod === "cash" && order.cashPrice && Number(order.cashPrice) > 0) {
          amountToRecord = order.cashPrice
        } else if (paymentMethod === "card" && order.cardPrice && Number(order.cardPrice) > 0) {
          amountToRecord = order.cardPrice
        }

        await db.insert(transactions).values({
          id: crypto.randomUUID(),
          userId,
          clientId: order.clientId,
          type: "receita",
          description: `OS #${String(order.number).padStart(4, "0")} — ${order.title}`,
          amount: amountToRecord,
          category: "Serviço",
          status: "pago",
          paidAt: new Date().toISOString().split("T")[0],
          dueDate: new Date().toISOString().split("T")[0],
        })
        revalidatePath("/dashboard/financeiro")
      }
    }
  }

  revalidatePath("/dashboard/ordens-servico")
}

export async function getClientHistory(clientId: string) {
  const userId = await getUserId()
  const orders = await db
    .select()
    .from(serviceOrders)
    .where(and(eq(serviceOrders.userId, userId), eq(serviceOrders.clientId, clientId)))
    .orderBy(desc(serviceOrders.createdAt))
  const clientQuotes = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.userId, userId), eq(quotes.clientId, clientId)))
    .orderBy(desc(quotes.createdAt))
  const txns = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.clientId, clientId)))
    .orderBy(desc(transactions.createdAt))
  return { orders, quotes: clientQuotes, transactions: txns }
}

export async function getServiceOrderForReceipt(id: string) {
  // Público — o ID da OS é o token de acesso, não requer autenticação
  try {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id)).limit(1)
    if (!order) return null
    const items = await db.select().from(serviceOrderItems).where(eq(serviceOrderItems.serviceOrderId, id))
    const [client] = await db.select().from(clients).where(eq(clients.id, order.clientId)).limit(1)
    const [profile] = await db.select().from(businessProfile).where(eq(businessProfile.userId, order.userId)).limit(1)
    return { ...order, items, client: client ?? null, profile: profile ?? null }
  } catch {
    return null
  }
}

export async function deleteServiceOrder(id: string) {
  const userId = await getUserId()
  await db.delete(serviceOrderItems).where(eq(serviceOrderItems.serviceOrderId, id))
  await db.delete(serviceOrders).where(and(eq(serviceOrders.id, id), eq(serviceOrders.userId, userId)))
  revalidatePath("/dashboard/ordens-servico")
}

export async function getServiceOrderWithItems(id: string) {
  // Public — no auth required: the order ID is the access token
  const order = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id)).limit(1)
  if (!order[0]) return null
  const items = await db.select().from(serviceOrderItems).where(eq(serviceOrderItems.serviceOrderId, id))
  const client = await db.select().from(clients).where(eq(clients.id, order[0].clientId)).limit(1)
  const profile = await db.select().from(businessProfile).where(eq(businessProfile.userId, order[0].userId)).limit(1)
  return { ...order[0], items, client: client[0] ?? null, profile: profile[0] ?? null }
}

// ── Reports ────────────────────────────────────────���──────────────────────────
export async function getReportData() {
  const userId = await getUserId()

  const [allTransactions, allQuotes, allClients, allServices] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(transactions.dueDate),
    db.select().from(quotes).where(eq(quotes.userId, userId)).orderBy(desc(quotes.createdAt)),
    db.select().from(clients).where(eq(clients.userId, userId)),
    db.select().from(services).where(eq(services.userId, userId)),
  ])

  // Receita x Despesa por mês (últimos 6 meses)
  const monthMap: Record<string, { month: string; receita: number; despesa: number }> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    monthMap[key] = { month: label, receita: 0, despesa: 0 }
  }

  for (const t of allTransactions) {
    if (t.status !== "pago") continue
    const dateStr = t.paidAt ?? t.dueDate ?? null
    if (!dateStr) continue
    const d = new Date(dateStr)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (!monthMap[key]) continue
    if (t.type === "receita") monthMap[key].receita += Number(t.amount)
    else monthMap[key].despesa += Number(t.amount)
  }
  const monthlyChart = Object.values(monthMap)

  // Status dos orçamentos para gráfico de pizza
  const quotesStatusCount: Record<string, number> = {}
  for (const q of allQuotes) {
    quotesStatusCount[q.status] = (quotesStatusCount[q.status] ?? 0) + 1
  }
  const quotesChart = Object.entries(quotesStatusCount).map(([status, count]) => ({ status, count }))

  // Totais gerais
  const totalReceita = allTransactions.filter(t => t.type === "receita" && t.status === "pago").reduce((a, t) => a + Number(t.amount), 0)
  const totalDespesa = allTransactions.filter(t => t.type === "despesa" && t.status === "pago").reduce((a, t) => a + Number(t.amount), 0)
  const totalPendente = allTransactions.filter(t => t.status === "pendente" && t.type === "receita").reduce((a, t) => a + Number(t.amount), 0)
  const totalAprovados = allQuotes.filter(q => q.status === "aprovado").length
  const taxaConversao = allQuotes.length > 0 ? Math.round((totalAprovados / allQuotes.length) * 100) : 0

  return {
    monthlyChart,
    quotesChart,
    totalReceita,
    totalDespesa,
    totalPendente,
    totalClients: allClients.length,
    totalQuotes: allQuotes.length,
    totalAprovados,
    taxaConversao,
    totalServices: allServices.length,
  }
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
    allTransactions,
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
    db.select().from(transactions).where(eq(transactions.userId, userId)),
  ])

  // Gráfico mensal — últimos 6 meses
  const monthMap: Record<string, { month: string; receita: number; despesa: number }> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthMap[key] = { month: d.toLocaleDateString("pt-BR", { month: "short" }), receita: 0, despesa: 0 }
  }
  for (const t of allTransactions) {
    if (t.status !== "pago") continue
    const dateStr = t.paidAt ?? t.dueDate ?? null
    if (!dateStr) continue
    const d = new Date(dateStr)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (!monthMap[key]) continue
    if (t.type === "receita") monthMap[key].receita += Number(t.amount)
    else monthMap[key].despesa += Number(t.amount)
  }
  const monthlyChart = Object.values(monthMap)

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
    monthlyChart,
  }
}

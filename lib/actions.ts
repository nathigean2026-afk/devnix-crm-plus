"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  businessProfile,
  clients,
  employeeInvites,
  employeePermissions,
  payments,
  promoCodes,
  quoteItems,
  quotes,
  serviceOrderItems,
  serviceOrders,
  services,
  session,
  supportMessages,
  supportTickets,
  transactions,
  user,
  verification,
} from "@/lib/db/schema"
import { and, count, desc, eq, isNull, like, sql } from "drizzle-orm"
import { sendQuoteResponseEmail } from "@/lib/email"
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
  cashPrice?: string
  cardPrice?: string
  cardInstallments?: number
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
    cashPrice: data.cashPrice || undefined,
    cardPrice: data.cardPrice || undefined,
    cardInstallments: data.cardInstallments || undefined,
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

export async function updateQuote(
  id: string,
  data: {
    clientId: string
    title: string
    validUntil?: string
    notes?: string
    internalNotes?: string
    subtotal: string
    discount: string
    total: string
    cashPrice?: string
    cardPrice?: string
    cardInstallments?: number
    items: {
      serviceId?: string
      description: string
      quantity: string
      unitPrice: string
      total: string
    }[]
  },
) {
  const userId = await getUserId()

  // Garante que o orçamento pertence ao prestador
  const [existing] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
    .limit(1)
  if (!existing) throw new Error("Orçamento não encontrado")

  // Ao editar, o orçamento volta para "enviado" para o cliente responder novamente,
  // limpando qualquer resposta anterior (recusa/aprovação) e o motivo.
  await db
    .update(quotes)
    .set({
      clientId: data.clientId,
      title: data.title,
      validUntil: data.validUntil || null,
      notes: data.notes || null,
      internalNotes: data.internalNotes || null,
      subtotal: data.subtotal,
      discount: data.discount,
      total: data.total,
      cashPrice: data.cashPrice || null,
      cardPrice: data.cardPrice || null,
      cardInstallments: data.cardInstallments || null,
      status: "enviado",
      rejectionReason: null,
      respondedAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))

  // Substitui os itens
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, id))
  if (data.items.length > 0) {
    await db.insert(quoteItems).values(
      data.items.map((item) => ({
        id: crypto.randomUUID(),
        quoteId: id,
        ...item,
      })),
    )
  }

  revalidatePath("/dashboard/orcamentos")
  revalidatePath(`/orcamento/${id}`)
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
    if (quote.status !== "enviado" && quote.status !== "rascunho") return { success: false, error: "Este orçamento não está disponível para resposta." }

    const now = new Date()
    await db
      .update(quotes)
      .set({
        status: decision,
        rejectionReason: decision === "recusado" ? (rejectionReason ?? null) : null,
        respondedAt: now,
        updatedAt: now,
      })
      .where(eq(quotes.id, id))

    revalidatePath(`/orcamento/${id}`)
    revalidatePath("/dashboard/orcamentos")
    revalidatePath("/dashboard/relatorios")

    // Notifica o prestador por e-mail (não bloqueia o fluxo se falhar)
    try {
      const [profile] = await db
        .select()
        .from(businessProfile)
        .where(eq(businessProfile.userId, quote.userId))
        .limit(1)
      const [owner] = await db
        .select({ email: user.email, name: user.name })
        .from(user)
        .where(eq(user.id, quote.userId))
        .limit(1)
      const [client] = await db
        .select({ name: clients.name })
        .from(clients)
        .where(eq(clients.id, quote.clientId))
        .limit(1)

      const to = profile?.email || owner?.email
      if (to) {
        await sendQuoteResponseEmail({
          to,
          providerName: profile?.name || owner?.name,
          clientName: client?.name ?? "Cliente",
          quoteNumber: quote.number,
          quoteTitle: quote.title,
          total: quote.total,
          decision,
          rejectionReason: rejectionReason ?? null,
          respondedAt: now,
        })
      }
    } catch (mailErr) {
      console.error("[v0] Falha ao notificar prestador por e-mail:", mailErr)
    }

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
  notifAlertEnabled?: boolean
  notifQuoteEnabled?: boolean
  docAccentColor?: string
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

export async function redeemPromoCode(code: string) {
  const userId = await getUserId()

  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code.toUpperCase().trim()))
    .limit(1)

  if (!promo) throw new Error("Código inválido ou não encontrado.")
  if (promo.usedBy) throw new Error("Este código já foi utilizado.")
  if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) throw new Error("Este código expirou.")

  // Busca a data de expiração atual do usuário para estender (não substituir)
  const [u] = await db.select({ accessExpiresAt: user.accessExpiresAt }).from(user).where(eq(user.id, userId)).limit(1)
  const now = new Date()
  const currentExpiry = u?.accessExpiresAt && u.accessExpiresAt > now ? u.accessExpiresAt : now
  const newExpiry = new Date(currentExpiry)
  newExpiry.setDate(newExpiry.getDate() + promo.days)

  // Marca o código como usado
  await db.update(promoCodes).set({ usedBy: userId, usedAt: new Date() }).where(eq(promoCodes.id, promo.id))

  // Atualiza a expiração real da licença na tabela user
  await db.update(user).set({ accessExpiresAt: newExpiry }).where(eq(user.id, userId))

  // Salva o plano no businessProfile para o admin visualizar
  const [profile] = await db.select({ id: businessProfile.id }).from(businessProfile).where(eq(businessProfile.userId, userId)).limit(1)
  if (profile) {
    await db.update(businessProfile).set({ licensePlan: promo.planName, updatedAt: new Date() }).where(eq(businessProfile.userId, userId))
  } else {
    await db.insert(businessProfile).values({ id: crypto.randomUUID(), userId, name: "", licensePlan: promo.planName })
  }

  revalidatePath("/dashboard/configuracoes")
  return { days: promo.days, planName: promo.planName, newExpiry: newExpiry.toISOString() }
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function adminGetStats() {
  const now = new Date()
  const onlineThreshold = new Date(now.getTime() - 15 * 60 * 1000) // 15 min

  const [totalUsersRes] = await db.select({ c: count() }).from(user)
  const [activeUsersRes] = await db.select({ c: count() }).from(user).where(sql`"accessExpiresAt" > now()`)
  const [expiredUsersRes] = await db.select({ c: count() }).from(user).where(sql`"accessExpiresAt" IS NOT NULL AND "accessExpiresAt" <= now()`)
  const [codesRes] = await db.select({ c: count() }).from(promoCodes)
  const [usedCodesRes] = await db.select({ c: count() }).from(promoCodes).where(sql`"usedBy" IS NOT NULL`)
  const [openTicketsRes] = await db.select({ c: count() }).from(supportTickets).where(sql`status IN ('aberto', 'em_andamento')`)

  // Usuários com sessão ativa nas últimas 15 min (online)
  const onlineSessions = await db
    .select({
      userId: session.userId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      updatedAt: session.updatedAt,
    })
    .from(session)
    .where(sql`${session.updatedAt} >= ${onlineThreshold} AND ${session.expiresAt} > now()`)
    .orderBy(desc(session.updatedAt))

  // Todos os usuários com dados de licença e última sessão
  const licenseData = await db
    .select({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userCreatedAt: user.createdAt,
      accessExpiresAt: user.accessExpiresAt,
      profileName: businessProfile.name,
      profileEmail: businessProfile.email,
      licensePlan: businessProfile.licensePlan,
      lastSessionIp: sql<string>`(SELECT "ipAddress" FROM session WHERE "userId" = ${user.id} ORDER BY "updatedAt" DESC LIMIT 1)`,
      lastSessionAt: sql<string>`(SELECT TO_CHAR("updatedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') FROM session WHERE "userId" = ${user.id} ORDER BY "updatedAt" DESC LIMIT 1)`,
      lastUserAgent: sql<string>`(SELECT "userAgent" FROM session WHERE "userId" = ${user.id} ORDER BY "updatedAt" DESC LIMIT 1)`,
    })
    .from(user)
    .leftJoin(businessProfile, eq(businessProfile.userId, user.id))
    .orderBy(desc(user.createdAt))
    .limit(100)

  // Logins diários últimos 14 dias
  let dailyLogins: { day: string; logins: number }[] = []
  try {
    const result = await db.execute(sql`
      SELECT TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') as day, COUNT(*) as logins
      FROM session
      WHERE "createdAt" >= NOW() - INTERVAL '14 days'
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    `)
    const rows = (result as any)?.rows ?? (Array.isArray(result) ? result : [])
    // day já vem como string "YYYY-MM-DD" via TO_CHAR, sem conversão de Date object
    dailyLogins = rows.map((r: any) => ({ day: String(r.day), logins: Number(r.logins) }))
  } catch { /* logins diários opcionais */ }

  // Latência do banco (ping real)
  let dbLatencyMs = 0
  try {
    const t0 = Date.now()
    await db.execute(sql`SELECT 1`)
    dbLatencyMs = Date.now() - t0
  } catch { /* ignorar */ }

  // Métricas básicas do banco
  let dbMetrics: { size: string; sizeBytes: number; connections: number; latencyMs: number; tableCount: number } | null = null
  try {
    const sizeResult = await db.execute(
      sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as size_bytes`
    )
    // Neon com Drizzle retorna { rows: [...] } — nunca um array direto
    const sizeRows = (sizeResult as any)?.rows ?? (Array.isArray(sizeResult) ? sizeResult : [])
    const dbSize = sizeRows[0]

    const tableResult = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    )
    const tableRows = (tableResult as any)?.rows ?? (Array.isArray(tableResult) ? tableResult : [])
    const tableCount = Number(tableRows[0]?.cnt ?? 0)

    dbMetrics = {
      size: dbSize?.size ?? "—",
      sizeBytes: Number(dbSize?.size_bytes ?? 0),
      connections: 0,
      latencyMs: dbLatencyMs,
      tableCount,
    }
  } catch { /* métricas de DB opcionais */ }

  // Assinaturas por período (baseado em licença ativa + plano no businessProfile)
  let subscriptionStats: { day: number; week: number; month: number; total: number } = { day: 0, week: 0, month: 0, total: 0 }
  try {
    const subResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE "accessExpiresAt" > now()) as total_active,
        COUNT(*) FILTER (WHERE "updatedAt" >= now() - INTERVAL '1 day') as updated_day,
        COUNT(*) FILTER (WHERE "updatedAt" >= now() - INTERVAL '7 days') as updated_week,
        COUNT(*) FILTER (WHERE "updatedAt" >= now() - INTERVAL '30 days') as updated_month
      FROM "user"
      WHERE "accessExpiresAt" IS NOT NULL
    `)
    const subRows = (subResult as any)?.rows ?? (Array.isArray(subResult) ? subResult : [])
    const row = subRows[0]
    subscriptionStats = {
      total: Number(row?.total_active ?? 0),
      day: Number(row?.updated_day ?? 0),
      week: Number(row?.updated_week ?? 0),
      month: Number(row?.updated_month ?? 0),
    }
  } catch { /* opcional */ }

  // Métricas financeiras de pagamentos aprovados
  let revenueStats: { totalCents: number; dayCents: number; weekCents: number; monthCents: number; totalCount: number } = {
    totalCents: 0, dayCents: 0, weekCents: 0, monthCents: 0, totalCount: 0,
  }
  try {
    const revenueResult = await db.execute(sql`
      SELECT
        COALESCE(SUM("amountCents"), 0) as total_cents,
        COALESCE(SUM("amountCents") FILTER (WHERE "paidAt" >= NOW() - INTERVAL '1 day'), 0) as day_cents,
        COALESCE(SUM("amountCents") FILTER (WHERE "paidAt" >= NOW() - INTERVAL '7 days'), 0) as week_cents,
        COALESCE(SUM("amountCents") FILTER (WHERE "paidAt" >= NOW() - INTERVAL '30 days'), 0) as month_cents,
        COUNT(*) FILTER (WHERE status = 'approved') as total_count
      FROM payments
      WHERE status = 'approved'
    `)
    const revenueRows = (revenueResult as any)?.rows ?? (Array.isArray(revenueResult) ? revenueResult : [])
    const r = revenueRows[0]
    revenueStats = {
      totalCents: Number(r?.total_cents ?? 0),
      dayCents: Number(r?.day_cents ?? 0),
      weekCents: Number(r?.week_cents ?? 0),
      monthCents: Number(r?.month_cents ?? 0),
      totalCount: Number(r?.total_count ?? 0),
    }
  } catch { /* opcional */ }

  return {
    totalUsers: Number(totalUsersRes.c),
    activeUsers: Number(activeUsersRes.c),
    expiredUsers: Number(expiredUsersRes.c),
    totalCodes: Number(codesRes.c),
    usedCodes: Number(usedCodesRes.c),
    openTickets: Number(openTicketsRes.c),
    onlineSessions,
    licenseData,
    dailyLogins,
    dbMetrics,
    subscriptionStats,
    revenueStats,
  }
}

export async function adminGetPayments() {
  return db
    .select({
      id: payments.id,
      mpPaymentId: payments.mpPaymentId,
      planId: payments.planId,
      planName: payments.planName,
      amountCents: payments.amountCents,
      status: payments.status,
      paymentMethod: payments.paymentMethod,
      durationDays: payments.durationDays,
      paidAt: payments.paidAt,
      expiresLicenseAt: payments.expiresLicenseAt,
      createdAt: payments.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(payments)
    .leftJoin(user, eq(payments.userId, user.id))
    .orderBy(desc(payments.createdAt))
    .limit(200)
}

export async function adminUpdateUser(userId: string, data: { name?: string; email?: string; accessExpiresAt?: string }) {
  await db.update(user).set({
    ...(data.name ? { name: data.name } : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(data.accessExpiresAt ? { accessExpiresAt: new Date(data.accessExpiresAt) } : {}),
    updatedAt: new Date(),
  }).where(eq(user.id, userId))
  revalidatePath("/admin")
}

export async function adminSendPasswordReset(userId: string): Promise<string> {
  // Gera token temporário de 1 hora para redefinição de senha
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1h
  await db.insert(verification).values({
    id: crypto.randomUUID(),
    identifier: `admin-reset-${userId}`,
    value: token,
    expiresAt,
  })
  // Retorna o link — o admin pode copiar e enviar manualmente
  return `/reset-password?token=${token}&userId=${userId}`
}

export async function adminExtendLicense(userId: string, days: number) {
  const [u] = await db.select({ accessExpiresAt: user.accessExpiresAt }).from(user).where(eq(user.id, userId)).limit(1)
  const now = new Date()
  const base = u?.accessExpiresAt && u.accessExpiresAt > now ? u.accessExpiresAt : now
  const newExpiry = new Date(base)
  newExpiry.setDate(newExpiry.getDate() + days)
  await db.update(user).set({ accessExpiresAt: newExpiry, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath("/admin")
  return newExpiry.toISOString()
}

export async function adminRevokeAccess(userId: string) {
  await db.update(user).set({ accessExpiresAt: new Date(0), updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath("/admin")
}

export async function adminDeleteUser(userId: string) {
  // Remove dados do usuário em ordem segura antes de deletar o registro principal.
  // Tabelas com onDelete:"cascade" são limpas automaticamente (session, account, etc.)
  // supportMessages não tem userId — deletar via ticketId dos tickets do usuário
  await db.delete(supportMessages).where(
    sql`"ticketId" IN (SELECT id FROM support_tickets WHERE "userId" = ${userId})`
  )
  await db.delete(supportTickets).where(eq(supportTickets.userId, userId))
  await db.delete(payments).where(eq(payments.userId, userId))
  await db.delete(transactions).where(eq(transactions.userId, userId))
  await db.delete(serviceOrderItems).where(
    sql`"serviceOrderId" IN (SELECT id FROM service_orders WHERE "userId" = ${userId})`
  )
  await db.delete(serviceOrders).where(eq(serviceOrders.userId, userId))
  await db.delete(quoteItems).where(
    sql`"quoteId" IN (SELECT id FROM quotes WHERE "userId" = ${userId})`
  )
  await db.delete(quotes).where(eq(quotes.userId, userId))
  await db.delete(services).where(eq(services.userId, userId))
  await db.delete(clients).where(eq(clients.userId, userId))
  await db.delete(employeePermissions).where(eq(employeePermissions.employeeId, userId))
  await db.delete(employeeInvites).where(eq(employeeInvites.ownerId, userId))
  await db.delete(businessProfile).where(eq(businessProfile.userId, userId))
  await db.delete(user).where(eq(user.id, userId))
  revalidatePath("/admin")
}

export async function adminCreatePromoCode(data: {
  code: string
  planName: string
  days: number
  expiresAt?: string
}) {
  await db.insert(promoCodes).values({
    id: crypto.randomUUID(),
    code: data.code.toUpperCase().trim(),
    planName: data.planName,
    days: data.days,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
  })
  revalidatePath("/admin")
}

export async function adminGetPromoCodes() {
  return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt))
}

export async function adminDeletePromoCode(id: string) {
  await db.delete(promoCodes).where(and(eq(promoCodes.id, id), isNull(promoCodes.usedBy)))
  revalidatePath("/admin")
}

// ── Suporte ───────────────────────────────────────────────────────────────────

export async function createSupportTicket(data: {
  subject: string
  category: string
  priority: string
  body: string
  attachments?: { name: string; url: string }[]
}) {
  const userId = await getUserId()
  const ticketId = crypto.randomUUID()
  await db.insert(supportTickets).values({
    id: ticketId,
    userId,
    subject: data.subject,
    category: data.category,
    priority: data.priority,
    status: "aberto",
  })
  await db.insert(supportMessages).values({
    id: crypto.randomUUID(),
    ticketId,
    authorId: userId,
    authorRole: "user",
    body: data.body,
    attachments: JSON.stringify(data.attachments ?? []),
  })
  revalidatePath("/dashboard/suporte")
  return ticketId
}

export async function getSupportTickets() {
  const userId = await getUserId()
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.updatedAt))
  return tickets
}

export async function getSupportTicket(id: string) {
  const userId = await getUserId()
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, id), eq(supportTickets.userId, userId)))
    .limit(1)
  if (!ticket) throw new Error("Ticket não encontrado")
  const messages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.ticketId, id))
    .orderBy(supportMessages.createdAt)
  return { ticket, messages }
}

export async function sendSupportMessage(
  ticketId: string,
  body: string,
  attachments: { name: string; url: string }[] = [],
) {
  const userId = await getUserId()
  // Verifica que o ticket pertence ao usuário
  const [ticket] = await db
    .select({ id: supportTickets.id, status: supportTickets.status })
    .from(supportTickets)
    .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, userId)))
    .limit(1)
  if (!ticket) throw new Error("Ticket não encontrado")
  if (ticket.status === "fechado" || ticket.status === "resolvido")
    throw new Error("Ticket fechado. Abra um novo ticket se precisar de mais ajuda.")

  await db.insert(supportMessages).values({
    id: crypto.randomUUID(),
    ticketId,
    authorId: userId,
    authorRole: "user",
    body,
    attachments: JSON.stringify(attachments),
  })
  // Reabre se estava pausado
  if (ticket.status === "pausado") {
    await db
      .update(supportTickets)
      .set({ status: "em_andamento", updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId))
  } else {
    await db
      .update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId))
  }
  revalidatePath(`/dashboard/suporte/${ticketId}`)
}

/** Fecha o ticket pelo próprio usuário (resolvido por conta própria) */
export async function closeTicketByUser(ticketId: string) {
  const userId = await getUserId()
  const [ticket] = await db
    .select({ id: supportTickets.id, status: supportTickets.status })
    .from(supportTickets)
    .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, userId)))
    .limit(1)
  if (!ticket) throw new Error("Ticket não encontrado")
  if (ticket.status === "fechado" || ticket.status === "resolvido")
    throw new Error("Ticket já está fechado.")
  await db
    .update(supportTickets)
    .set({ status: "fechado", updatedAt: new Date() })
    .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, userId)))
  revalidatePath(`/dashboard/suporte/${ticketId}`)
  revalidatePath("/dashboard/suporte")
}

/** Retorna o licensePlan do usuário logado */
export async function getUserLicensePlan(): Promise<string> {
  const userId = await getUserId()
  const [profile] = await db
    .select({ licensePlan: businessProfile.licensePlan })
    .from(businessProfile)
    .where(eq(businessProfile.userId, userId))
    .limit(1)
  return (profile?.licensePlan ?? "starter").toLowerCase()
}

// ── Suporte (Admin) ───────────────────────────────────────────────────────────

export async function adminGetTickets() {
  const tickets = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      category: supportTickets.category,
      status: supportTickets.status,
      priority: supportTickets.priority,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      userId: supportTickets.userId,
      userName: user.name,
      userEmail: user.email,
      licensePlan: businessProfile.licensePlan,
    })
    .from(supportTickets)
    .leftJoin(user, eq(user.id, supportTickets.userId))
    .leftJoin(businessProfile, eq(businessProfile.userId, supportTickets.userId))
    .orderBy(desc(supportTickets.updatedAt))
  return tickets
}

export async function adminGetTicket(id: string) {
  const [ticket] = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      category: supportTickets.category,
      status: supportTickets.status,
      priority: supportTickets.priority,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      userId: supportTickets.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(supportTickets)
    .leftJoin(user, eq(user.id, supportTickets.userId))
    .where(eq(supportTickets.id, id))
    .limit(1)
  if (!ticket) throw new Error("Ticket não encontrado")
  const messages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.ticketId, id))
    .orderBy(supportMessages.createdAt)
  return { ticket, messages }
}

export async function adminReplyTicket(
  ticketId: string,
  body: string,
  attachments: { name: string; url: string }[] = [],
) {
  await db.insert(supportMessages).values({
    id: crypto.randomUUID(),
    ticketId,
    authorId: "admin",
    authorRole: "admin",
    body,
    attachments: JSON.stringify(attachments),
  })
  await db
    .update(supportTickets)
    .set({ status: "em_andamento", updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId))
  revalidatePath("/admin")
}

export async function adminUpdateTicketStatus(
  ticketId: string,
  status: "aberto" | "em_andamento" | "pausado" | "resolvido" | "fechado",
) {
  await db
    .update(supportTickets)
    .set({
      status,
      updatedAt: new Date(),
      closedAt: status === "fechado" || status === "resolvido" ? new Date() : undefined,
    })
    .where(eq(supportTickets.id, ticketId))
  revalidatePath("/admin")
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
  paymentMethod?: "pix" | "cash" | "card" | "other",
  customAmount?: string
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

  const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id)).limit(1)
  if (!order) { revalidatePath("/dashboard/ordens-servico"); return }

  const orderPrefix = `OS #${String(order.number).padStart(4, "0")} —`

  // Se o status foi revertido (não-concluído), remove o lançamento financeiro desta OS
  if (status !== "concluido") {
    await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          like(transactions.description, `${orderPrefix}%`)
        )
      )
    revalidatePath("/dashboard/financeiro")
    revalidatePath("/dashboard/relatorios")
    revalidatePath("/dashboard/ordens-servico")
    return
  }

  // Auto-lançamento financeiro ao concluir OS
  if (Number(order.total) > 0 || (customAmount && Number(customAmount) > 0)) {
    // Anti-duplicata: verifica se já existe lançamento para esta OS
    const existing = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          like(transactions.description, `${orderPrefix}%`)
        )
      )
      .limit(1)

    if (existing.length === 0) {
      // Determina valor: customAmount > cashPrice/cardPrice > total
      let amountToRecord: string = order.total
      if (customAmount && Number(customAmount) > 0) {
        amountToRecord = customAmount
      } else if ((paymentMethod === "cash" || paymentMethod === "pix") && order.cashPrice && Number(order.cashPrice) > 0) {
        amountToRecord = order.cashPrice
      } else if (paymentMethod === "card" && order.cardPrice && Number(order.cardPrice) > 0) {
        amountToRecord = order.cardPrice
      }

      const paymentLabel = paymentMethod === "pix" ? " (Pix)"
        : paymentMethod === "cash" ? " (À vista)"
        : paymentMethod === "card" ? " (Cartão)"
        : customAmount && Number(customAmount) > 0 ? " (Valor informado)"
        : ""

      await db.insert(transactions).values({
        id: crypto.randomUUID(),
        userId,
        clientId: order.clientId,
        type: "receita",
        description: `${orderPrefix} ${order.title}${paymentLabel}`,
        amount: amountToRecord,
        category: "Serviço",
        status: "pago",
        paidAt: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
      })
      revalidatePath("/dashboard/financeiro")
      revalidatePath("/dashboard/relatorios")
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

// ── Dashboard Stats ────────────────────────────────────���──────────��───────────
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

// ── Funcionarios (Enterprise) ──────────────────────────────────────────────��──

/** Retorna o funcionario vinculado ao dono (se houver) e o convite pendente */
export async function getEmployeeData() {
  const userId = await getUserId()

  // Permissao ativa
  const [perms] = await db
    .select({
      id: employeePermissions.id,
      employeeId: employeePermissions.employeeId,
      employeeName: user.name,
      employeeEmail: user.email,
      canClients: employeePermissions.canClients,
      canServices: employeePermissions.canServices,
      canQuotes: employeePermissions.canQuotes,
      canOrders: employeePermissions.canOrders,
      canFinanceiro: employeePermissions.canFinanceiro,
      canRelatorios: employeePermissions.canRelatorios,
    })
    .from(employeePermissions)
    .leftJoin(user, eq(user.id, employeePermissions.employeeId))
    .where(eq(employeePermissions.ownerId, userId))
    .limit(1)

  // Convite pendente mais recente
  const [invite] = await db
    .select()
    .from(employeeInvites)
    .where(and(eq(employeeInvites.ownerId, userId), eq(employeeInvites.status, "pending")))
    .orderBy(desc(employeeInvites.createdAt))
    .limit(1)

  return { employee: perms ?? null, pendingInvite: invite ?? null }
}

/** Envia convite para o email do funcionario */
export async function inviteEmployee(email: string) {
  const userId = await getUserId()

  // Verifica plano Enterprise
  const [profile] = await db
    .select({ licensePlan: businessProfile.licensePlan })
    .from(businessProfile)
    .where(eq(businessProfile.userId, userId))
    .limit(1)

  const plan = (profile?.licensePlan ?? "starter").toLowerCase()
  if (plan !== "enterprise") throw new Error("Disponivel apenas no plano Enterprise.")

  // Verifica se ja tem funcionario ativo
  const existing = await db
    .select({ id: employeePermissions.id })
    .from(employeePermissions)
    .where(eq(employeePermissions.ownerId, userId))
    .limit(1)
  if (existing.length > 0) throw new Error("Voce ja tem um funcionario vinculado. Remova-o para convidar outro.")

  // Cancela convites pendentes anteriores
  await db
    .update(employeeInvites)
    .set({ status: "cancelled" })
    .where(and(eq(employeeInvites.ownerId, userId), eq(employeeInvites.status, "pending")))

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

  await db.insert(employeeInvites).values({
    id: crypto.randomUUID(),
    ownerId: userId,
    email: email.toLowerCase().trim(),
    status: "pending",
    token,
    expiresAt,
  })

  revalidatePath("/dashboard/configuracoes")
  return { token, expiresAt: expiresAt.toISOString() }
}

/** Cancela convite pendente */
export async function cancelEmployeeInvite(inviteId: string) {
  const userId = await getUserId()
  await db
    .update(employeeInvites)
    .set({ status: "cancelled" })
    .where(and(eq(employeeInvites.id, inviteId), eq(employeeInvites.ownerId, userId)))
  revalidatePath("/dashboard/configuracoes")
}

/** Atualiza permissoes do funcionario */
export async function updateEmployeePermissions(permId: string, perms: {
  canClients: boolean
  canServices: boolean
  canQuotes: boolean
  canOrders: boolean
  canFinanceiro: boolean
  canRelatorios: boolean
}) {
  const userId = await getUserId()
  await db
    .update(employeePermissions)
    .set({ ...perms, updatedAt: new Date() })
    .where(and(eq(employeePermissions.id, permId), eq(employeePermissions.ownerId, userId)))
  revalidatePath("/dashboard/configuracoes")
}

/** Remove o funcionario vinculado */
export async function removeEmployee(permId: string) {
  const userId = await getUserId()
  await db
    .delete(employeePermissions)
    .where(and(eq(employeePermissions.id, permId), eq(employeePermissions.ownerId, userId)))
  revalidatePath("/dashboard/configuracoes")
}

/** Aceita convite via token (chamado pelo funcionario ao clicar no link) */
export async function acceptEmployeeInvite(token: string) {
  const userId = await getUserId()

  const [invite] = await db
    .select()
    .from(employeeInvites)
    .where(and(eq(employeeInvites.token, token), eq(employeeInvites.status, "pending")))
    .limit(1)

  if (!invite) throw new Error("Convite invalido ou expirado.")
  if (new Date() > invite.expiresAt) throw new Error("Convite expirado.")

  // Verifica se o email do convite bate com o usuario logado
  const [invitedUser] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  if (invitedUser?.email.toLowerCase() !== invite.email.toLowerCase())
    throw new Error("Este convite foi enviado para outro e-mail.")

  // Cria permissoes (todas desativadas por padrao — dono define depois)
  await db.insert(employeePermissions).values({
    id: crypto.randomUUID(),
    ownerId: invite.ownerId,
    employeeId: userId,
    canClients: false,
    canServices: false,
    canQuotes: false,
    canOrders: false,
    canFinanceiro: false,
    canRelatorios: false,
  }).onConflictDoNothing()

  // Marca convite como aceito
  await db
    .update(employeeInvites)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(employeeInvites.id, invite.id))

  return { ownerId: invite.ownerId }
}

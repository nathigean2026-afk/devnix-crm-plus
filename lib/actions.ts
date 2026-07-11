"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  account,
  activityLog,
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
  saasConfig,
  patchNotes,
  pushSubscriptions,
  adminLog,
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

/**
 * Retorna o userId efetivo para queries de dados:
 * - Funcionário convidado → retorna o ownerId (prestador) para que veja os dados do prestador
 * - Prestador/usuário normal → retorna o próprio id
 */
export async function getEffectiveUserId(): Promise<{ effectiveId: string; isEmployee: boolean; ownerId: string | null }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Não autorizado")
  const myId = session.user.id

  const [empLink] = await db
    .select({ ownerId: employeePermissions.ownerId })
    .from(employeePermissions)
    .where(eq(employeePermissions.employeeId, myId))
    .limit(1)

  if (empLink) {
    return { effectiveId: empLink.ownerId, isEmployee: true, ownerId: empLink.ownerId }
  }
  return { effectiveId: myId, isEmployee: false, ownerId: null }
}

/**
 * Retorna as permissões do funcionário ou null (sem restrições) para prestador/admin.
 */
export async function getMyPermissions(): Promise<{
  isEmployee: boolean
  ownerId: string | null
  canClients: boolean
  canServices: boolean
  canQuotes: boolean
  canOrders: boolean
  canFinanceiro: boolean
  canRelatorios: boolean
  canDashboard: boolean
  canDelete: boolean
  canSendQuotes: boolean
} | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Não autorizado")
  const myId = session.user.id

  const [perm] = await db
    .select()
    .from(employeePermissions)
    .where(eq(employeePermissions.employeeId, myId))
    .limit(1)

  if (!perm) return null // prestador — sem restrições

  return {
    isEmployee: true,
    ownerId: perm.ownerId,
    canClients: perm.canClients,
    canServices: perm.canServices,
    canQuotes: perm.canQuotes,
    canOrders: perm.canOrders,
    canFinanceiro: perm.canFinanceiro,
    canRelatorios: perm.canRelatorios,
    canDashboard: perm.canDashboard ?? true,
    canDelete: perm.canDelete ?? false,
    canSendQuotes: perm.canSendQuotes ?? false,
  }
}

/**
 * Registra uma ação do funcionário no log de auditoria.
 * Falha silenciosamente para não interromper fluxos principais.
 */
async function logActivity({
  ownerId,
  employeeId,
  employeeName,
  action,
  module,
  description,
  recordId,
}: {
  ownerId: string
  employeeId: string
  employeeName?: string | null
  action: string
  module: string
  description: string
  recordId?: string
}) {
  try {
    await db.insert(activityLog).values({
      id: crypto.randomUUID(),
      ownerId,
      employeeId,
      employeeName: employeeName ?? null,
      action,
      module,
      description,
      recordId: recordId ?? null,
    })
  } catch {
    // Falha silenciosamente — log não deve quebrar a ação principal
  }
}

/**
 * Retorna o log de atividades do funcionário para o dono da empresa.
 */
export async function getActivityLog(limit = 100) {
  const userId = await getUserId()
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.ownerId, userId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
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
  const { effectiveId } = await getEffectiveUserId()
  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, effectiveId))
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
  birthdate?: string
}) {
  const hdrs = await headers()
  const sess = await auth.api.getSession({ headers: hdrs })
  if (!sess?.user) throw new Error("Não autorizado")
  const { effectiveId, isEmployee, ownerId } = await getEffectiveUserId()
  const id = crypto.randomUUID()
  await db.insert(clients).values({ id, userId: effectiveId, ...data })
  if (isEmployee && ownerId) {
    logActivity({ ownerId, employeeId: sess.user.id, employeeName: sess.user.name, action: "create", module: "clientes", description: `Cadastrou o cliente "${data.name}"`, recordId: id })
  }
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
    birthdate: string
  }>
) {
  const { effectiveId } = await getEffectiveUserId()
  await db
    .update(clients)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.userId, effectiveId)))
  revalidatePath("/dashboard/clientes")
}

export async function deleteClient(id: string) {
  const hdrs = await headers()
  const sess = await auth.api.getSession({ headers: hdrs })
  if (!sess?.user) throw new Error("Não autorizado")
  const { effectiveId, isEmployee, ownerId } = await getEffectiveUserId()
  const perms = await getMyPermissions()
  if (isEmployee && !perms?.canDelete) throw new Error("Sem permissão para excluir registros.")
  const [target] = await db.select({ name: clients.name }).from(clients).where(and(eq(clients.id, id), eq(clients.userId, effectiveId))).limit(1)
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, effectiveId)))
  if (isEmployee && ownerId) {
    logActivity({ ownerId, employeeId: sess.user.id, employeeName: sess.user.name, action: "delete", module: "clientes", description: `Excluiu o cliente "${target?.name ?? id}"`, recordId: id })
  }
  revalidatePath("/dashboard/clientes")
}

// ── Services ─────────────────────────────────────────────────────────────────
export async function getServices() {
  const { effectiveId } = await getEffectiveUserId()
  return db
    .select()
    .from(services)
    .where(eq(services.userId, effectiveId))
    .orderBy(desc(services.createdAt))
}

export async function createService(data: {
  name: string
  description?: string
  price: string
  unit?: string
  category?: string
}) {
  const { effectiveId } = await getEffectiveUserId()
  await db.insert(services).values({
    id: crypto.randomUUID(),
    userId: effectiveId,
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
  const { effectiveId } = await getEffectiveUserId()
  await db
    .update(services)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(services.id, id), eq(services.userId, effectiveId)))
  revalidatePath("/dashboard/servicos")
}

export async function deleteService(id: string) {
  const hdrs = await headers()
  const sess = await auth.api.getSession({ headers: hdrs })
  if (!sess?.user) throw new Error("Não autorizado")
  const { effectiveId, isEmployee, ownerId } = await getEffectiveUserId()
  const perms = await getMyPermissions()
  if (isEmployee && !perms?.canDelete) throw new Error("Sem permissão para excluir registros.")
  const [target] = await db.select({ name: services.name }).from(services).where(and(eq(services.id, id), eq(services.userId, effectiveId))).limit(1)
  await db.delete(services).where(and(eq(services.id, id), eq(services.userId, effectiveId)))
  if (isEmployee && ownerId) {
    logActivity({ ownerId, employeeId: sess.user.id, employeeName: sess.user.name, action: "delete", module: "servicos", description: `Excluiu o serviço "${target?.name ?? id}"`, recordId: id })
  }
  revalidatePath("/dashboard/servicos")
}

// ── Quotes ───────────────────────────────────────────────────────────────────
export async function getQuotes() {
  const { effectiveId } = await getEffectiveUserId()
  return db
    .select()
    .from(quotes)
    .where(eq(quotes.userId, effectiveId))
    .orderBy(desc(quotes.createdAt))
}

/** Retorna os primeiros IDs disponíveis para preview de documentos nas configurações */
export async function getPreviewDocumentIds(): Promise<{
  quoteId: string | null
  serviceOrderId: string | null
}> {
  const { effectiveId } = await getEffectiveUserId()
  const [firstQuote, firstOs] = await Promise.all([
    db.select({ id: quotes.id }).from(quotes).where(eq(quotes.userId, effectiveId)).orderBy(desc(quotes.createdAt)).limit(1),
    db.select({ id: serviceOrders.id }).from(serviceOrders).where(eq(serviceOrders.userId, effectiveId)).orderBy(desc(serviceOrders.createdAt)).limit(1),
  ])
  return {
    quoteId: firstQuote[0]?.id ?? null,
    serviceOrderId: firstOs[0]?.id ?? null,
  }
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
  const { effectiveId } = await getEffectiveUserId()
  const number = await getNextQuoteNumber(effectiveId)
  const quoteId = crypto.randomUUID()

  await db.insert(quotes).values({
    id: quoteId,
    userId: effectiveId,
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
  const hdrs = await headers()
  const sess = await auth.api.getSession({ headers: hdrs })
  if (!sess?.user) throw new Error("Não autorizado")
  const { effectiveId, isEmployee, ownerId } = await getEffectiveUserId()
  const perms = await getMyPermissions()
  // Ao editar, o orçamento é enviado ao cliente — verificar permissão canSendQuotes
  if (isEmployee && !perms?.canSendQuotes) throw new Error("Sem permissão para enviar orçamentos.")

  // Garante que o orçamento pertence ao prestador
  const [existing] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, id), eq(quotes.userId, effectiveId)))
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
    .where(and(eq(quotes.id, id), eq(quotes.userId, effectiveId)))

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

  if (isEmployee && ownerId) {
    logActivity({ ownerId, employeeId: sess.user.id, employeeName: sess.user.name, action: "send", module: "orcamentos", description: `Enviou o orçamento "${data.title}"`, recordId: id })
  }
  revalidatePath("/dashboard/orcamentos")
  revalidatePath(`/orcamento/${id}`)
}

export async function updateQuoteStatus(id: string, status: string) {
  const { effectiveId } = await getEffectiveUserId()
  await db
    .update(quotes)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(quotes.id, id), eq(quotes.userId, effectiveId)))
  revalidatePath("/dashboard/orcamentos")
}

/**
 * Envia mensagem WhatsApp ao prestador via Wame API.
 * As credenciais (WAME_API_KEY e WAME_INSTANCE_ID) ficam apenas no servidor.
 * O número de destino é o whatsappPhone cadastrado pelo prestador.
 * Falha silenciosamente — nunca bloqueia o fluxo principal.
 */
async function sendWhatsAppNotification(phone: string, message: string) {
  try {
    const { sendWhatsApp } = await import("@/lib/whatsapp")
    await sendWhatsApp(phone, message)
  } catch {
    // Falha silenciosamente — não deve quebrar o fluxo principal
  }
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

    // Carrega o perfil e plano do prestador para checar permissões
    const [profile] = await db
      .select()
      .from(businessProfile)
      .where(eq(businessProfile.userId, quote.userId))
      .limit(1)

    // Normaliza para minúsculo — o banco pode ter "Starter", "Business" etc.
    const ownerPlan = (profile?.licensePlan ?? "starter").toLowerCase()
    const hasBusinessPlus = ownerPlan === "business" || ownerPlan === "enterprise"

    // Notifica o prestador por e-mail apenas se tiver plano Business+
    if (hasBusinessPlus) {
      try {
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
    }

    // Notifica via WhatsApp se tiver número cadastrado e notificação de orçamento ativada
    if (profile?.whatsappPhone && profile?.wappNotifQuote !== false) {
      try {
        const [clientRow] = await db
          .select({ name: clients.name })
          .from(clients)
          .where(eq(clients.id, quote.clientId))
          .limit(1)

        const clientName = clientRow?.name ?? "Um cliente"
        const { msgOrcamentoAprovado, msgOrcamentoRecusado } = await import("@/lib/whatsapp")

        const msg = decision === "aprovado"
          ? msgOrcamentoAprovado({ clientName, quoteTitle: quote.title, quoteNumber: quote.number, total: Number(quote.total) })
          : msgOrcamentoRecusado({ clientName, quoteTitle: quote.title, quoteNumber: quote.number, rejectionReason })

        await sendWhatsAppNotification(profile.whatsappPhone, msg)
      } catch {
        // Falha silenciosa
      }
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
        // Herda condições de pagamento do orçamento aprovado
        cashPrice: quote.cashPrice ?? undefined,
        cardPrice: quote.cardPrice ?? undefined,
        cardInstallments: quote.cardInstallments ?? undefined,
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
  const hdrs = await headers()
  const sess = await auth.api.getSession({ headers: hdrs })
  if (!sess?.user) throw new Error("Não autorizado")
  const { effectiveId, isEmployee, ownerId } = await getEffectiveUserId()
  const perms = await getMyPermissions()
  if (isEmployee && !perms?.canDelete) throw new Error("Sem permissão para excluir registros.")
  const [target] = await db.select({ title: quotes.title }).from(quotes).where(and(eq(quotes.id, id), eq(quotes.userId, effectiveId))).limit(1)
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, id))
  await db.delete(quotes).where(and(eq(quotes.id, id), eq(quotes.userId, effectiveId)))
  if (isEmployee && ownerId) {
    logActivity({ ownerId, employeeId: sess.user.id, employeeName: sess.user.name, action: "delete", module: "orcamentos", description: `Excluiu o orçamento "${target?.title ?? id}"`, recordId: id })
  }
  revalidatePath("/dashboard/orcamentos")
}

export async function getQuoteWithItems(id: string) {
  const { effectiveId } = await getEffectiveUserId()
  const quote = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, id), eq(quotes.userId, effectiveId)))
    .limit(1)
  if (!quote[0]) return null

  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, id))

  return { ...quote[0], items }
}

// ── Transactions ─────────���────────────────────────────────────────────────────
export async function getTransactions() {
  const { effectiveId } = await getEffectiveUserId()
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, effectiveId))
    .orderBy(desc(transactions.createdAt))
}

export async function createTransaction(data: {
  clientId?: string
  quoteId?: string
  serviceOrderId?: string
  type: string
  description: string
  amount: string
  category?: string
  dueDate?: string
  status?: string
}) {
  const { effectiveId } = await getEffectiveUserId()
  await db.insert(transactions).values({
    id: crypto.randomUUID(),
    userId: effectiveId,
    clientId: data.clientId || undefined,
    quoteId: data.quoteId || undefined,
    serviceOrderId: data.serviceOrderId || undefined,
    type: data.type,
    description: data.description,
    amount: data.amount,
    category: data.category || undefined,
    dueDate: data.dueDate || undefined,
    status: data.status || "pendente",
  })
  // Se a transação for paga e ligada a uma OS, marca a OS como paga
  if (data.serviceOrderId && (data.status === "pago")) {
    await db.update(serviceOrders)
      .set({ paymentStatus: "pago" })
      .where(and(eq(serviceOrders.id, data.serviceOrderId), eq(serviceOrders.userId, effectiveId)))
  }
  revalidatePath("/dashboard/financeiro")
  revalidatePath("/dashboard/ordens-servico")
}

export async function updateServiceOrderPaymentStatus(orderId: string, paymentStatus: "pendente" | "pago") {
  const { effectiveId } = await getEffectiveUserId()
  await db.update(serviceOrders)
    .set({ paymentStatus, updatedAt: new Date() })
    .where(and(eq(serviceOrders.id, orderId), eq(serviceOrders.userId, effectiveId)))
  revalidatePath("/dashboard/ordens-servico")
  revalidatePath("/dashboard/relatorios")
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
  const { effectiveId } = await getEffectiveUserId()
  await db
    .update(transactions)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.userId, effectiveId)))
  revalidatePath("/dashboard/financeiro")
}

export async function deleteTransaction(id: string) {
  const hdrs = await headers()
  const sess = await auth.api.getSession({ headers: hdrs })
  if (!sess?.user) throw new Error("Não autorizado")
  const { effectiveId, isEmployee, ownerId } = await getEffectiveUserId()
  const perms = await getMyPermissions()
  if (isEmployee && !perms?.canDelete) throw new Error("Sem permissão para excluir registros.")
  const [target] = await db.select({ description: transactions.description }).from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, effectiveId))).limit(1)
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, effectiveId)))
  if (isEmployee && ownerId) {
    logActivity({ ownerId, employeeId: sess.user.id, employeeName: sess.user.name, action: "delete", module: "financeiro", description: `Excluiu a transação "${target?.description ?? id}"`, recordId: id })
  }
  revalidatePath("/dashboard/financeiro")
}

// ── Business Profile ───────────────────���────────���─────────────────────────────
export async function getBusinessProfile() {
  const { effectiveId } = await getEffectiveUserId()
  const rows = await db.select().from(businessProfile).where(eq(businessProfile.userId, effectiveId)).limit(1)
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
  whatsappPhone?: string
  wappNotifQuote?: boolean
  wappNotifLicense?: boolean
  quoteDefaultValidity?: number
  quoteWhatsappTemplate?: string
  docFooter?: string
  wappNotifBirthday?: boolean
  // Chatbot WhatsApp Fase 2
  chatbotEnabled?: boolean
  chatbotNome?: string
  chatbotNicho?: string
  chatbotMenu?: string
  chatbotSaudacao?: string
  chatbotHorario?: string
  chatbotContato?: string
}) {
  const { effectiveId, isEmployee } = await getEffectiveUserId()
  if (isEmployee) throw new Error("Funcionários não podem editar os dados da empresa.")
  const existing = await db.select({ id: businessProfile.id }).from(businessProfile).where(eq(businessProfile.userId, effectiveId)).limit(1)
  if (existing[0]) {
    await db.update(businessProfile).set({ ...data, updatedAt: new Date() }).where(eq(businessProfile.userId, effectiveId))
  } else {
    await db.insert(businessProfile).values({ id: crypto.randomUUID(), userId: effectiveId, name: data.name ?? "", ...data })
  }
  revalidatePath("/dashboard/configuracoes")
}

export async function redeemPromoCode(code: string): Promise<
  | { success: true; durationMinutes: number; planName: string; newExpiry: string; alreadyUsed: false }
  | { success: false; error: string; alreadyUsed: boolean }
> {
  try {
    const userId = await getUserId()

    const [promo] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code.toUpperCase().trim()))
      .limit(1)

    if (!promo) return { success: false, error: "Código inválido ou não encontrado.", alreadyUsed: false }
    if (promo.usedBy) return { success: false, error: "Este código já foi utilizado.", alreadyUsed: true }
    if (promo.expiresAt && new Date() > new Date(promo.expiresAt))
      return { success: false, error: "Este código expirou.", alreadyUsed: false }

    // Busca a data de expiração atual do usuário para estender (não substituir)
    const [u] = await db.select({ accessExpiresAt: user.accessExpiresAt }).from(user).where(eq(user.id, userId)).limit(1)
    const now = new Date()
    const currentExpiry = u?.accessExpiresAt && u.accessExpiresAt > now ? u.accessExpiresAt : now
    const newExpiry = new Date(currentExpiry)
    // Usa durationMinutes com precisão total.
    // Fallback para days * 1440 apenas quando durationMinutes é null E days > 0.
    // Se ambos forem 0/null, usa 1440 (1 dia) como segurança mínima.
    const minutes =
      (promo.durationMinutes != null && promo.durationMinutes > 0)
        ? promo.durationMinutes
        : (promo.days > 0 ? promo.days * 1440 : 1440)
    newExpiry.setTime(newExpiry.getTime() + minutes * 60 * 1000)

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

    revalidatePath("/planos")
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/configuracoes")

    return { success: true, durationMinutes: minutes, planName: promo.planName, newExpiry: newExpiry.toISOString(), alreadyUsed: false }
  } catch (e) {
    console.error("[redeemPromoCode] erro inesperado:", e)
    return { success: false, error: "Erro interno ao ativar o código. Tente novamente.", alreadyUsed: false }
  }
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

export async function adminUpdateUser(userId: string, data: { name?: string; email?: string; accessExpiresAt?: string }, adminEmail?: string) {
  await db.update(user).set({
    ...(data.name ? { name: data.name } : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(data.accessExpiresAt ? { accessExpiresAt: new Date(data.accessExpiresAt) } : {}),
    updatedAt: new Date(),
  }).where(eq(user.id, userId))
  const targetUser = await db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1)
  const parts: string[] = []
  if (data.name) parts.push(`nome para "${data.name}"`)
  if (data.email) parts.push(`email para "${data.email}"`)
  if (data.accessExpiresAt) parts.push(`vencimento para ${data.accessExpiresAt}`)
  await db.insert(adminLog).values({
    id: crypto.randomUUID(),
    adminEmail: adminEmail || "admin",
    action: "update_user",
    description: `Dados de "${targetUser[0]?.name || userId}" atualizados: ${parts.join(", ")}`,
    targetUserId: userId,
    targetUserEmail: targetUser[0]?.email || data.email || null,
    createdAt: new Date(),
  })
  revalidatePath("/admin")
}

export async function adminChangePlan(userId: string, plan: "starter" | "business" | "enterprise", adminEmail?: string) {
  // Verifica primeiro se o perfil existe para fazer insert ou update correto
  const existing = await db.select({ id: businessProfile.id, licensePlan: businessProfile.licensePlan })
    .from(businessProfile).where(eq(businessProfile.userId, userId)).limit(1)

  if (existing.length === 0) {
    await db.insert(businessProfile).values({
      id: crypto.randomUUID(),
      userId,
      name: "",
      licensePlan: plan,
    })
  } else {
    await db.update(businessProfile)
      .set({ licensePlan: plan, updatedAt: new Date() })
      .where(eq(businessProfile.userId, userId))
  }

  // Registra no log de admin
  const targetUser = await db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1)
  const targetName = targetUser[0]?.name || targetUser[0]?.email || userId
  const oldPlan = existing[0]?.licensePlan || "—"
  await db.insert(adminLog).values({
    id: crypto.randomUUID(),
    adminEmail: adminEmail || "admin",
    action: "change_plan",
    description: `Plano de "${targetName}" alterado de ${oldPlan} para ${plan}`,
    targetUserId: userId,
    targetUserEmail: targetUser[0]?.email || null,
    meta: JSON.stringify({ from: oldPlan, to: plan }),
    createdAt: new Date(),
  })

  revalidatePath("/admin")
}

export async function adminClearUsedCodes(adminEmail?: string) {
  const deleted = await db.delete(promoCodes).where(sql`"usedBy" IS NOT NULL`)
  await db.insert(adminLog).values({
    id: crypto.randomUUID(),
    adminEmail: adminEmail || "admin",
    action: "clear_codes",
    description: `Lista de códigos usados limpa`,
    createdAt: new Date(),
  })
  revalidatePath("/admin")
}

export async function adminGetLogs(limit = 200): Promise<{ id: string; adminEmail: string; action: string; description: string; targetUserId: string | null; targetUserEmail: string | null; meta: string | null; createdAt: Date }[]> {
  return db.select().from(adminLog).orderBy(desc(adminLog.createdAt)).limit(limit)
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

export async function verifyResetToken(token: string, userId: string): Promise<{ valid: boolean; message?: string }> {
  const rows = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, `admin-reset-${userId}`))
    .limit(1)
  if (rows.length === 0) return { valid: false, message: "Link inválido ou expirado." }
  const row = rows[0]
  if (row.value !== token) return { valid: false, message: "Token inválido." }
  if (new Date(row.expiresAt) < new Date()) return { valid: false, message: "Link expirado. Solicite um novo ao administrador." }
  return { valid: true }
}

export async function updatePasswordByToken(token: string, userId: string, newPassword: string): Promise<{ ok: boolean; message?: string }> {
  const check = await verifyResetToken(token, userId)
  if (!check.valid) return { ok: false, message: check.message }
  // Hash da nova senha usando better-auth crypto
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { hashPassword } = await import("better-auth/crypto")
  const hashed = await (hashPassword as (p: string) => Promise<string>)(newPassword)
  // Atualiza a senha na tabela account
  await db
    .update(account)
    .set({ password: hashed })
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
  // Remove o token de verificação usado
  await db.delete(verification).where(eq(verification.identifier, `admin-reset-${userId}`))
  return { ok: true }
}

export async function adminExtendLicense(userId: string, days: number, adminEmail?: string) {
  const [u] = await db.select({ accessExpiresAt: user.accessExpiresAt, name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1)
  const now = new Date()
  const base = u?.accessExpiresAt && u.accessExpiresAt > now ? u.accessExpiresAt : now
  const newExpiry = new Date(base)
  newExpiry.setDate(newExpiry.getDate() + days)
  await db.update(user).set({ accessExpiresAt: newExpiry, updatedAt: new Date() }).where(eq(user.id, userId))
  await db.insert(adminLog).values({
    id: crypto.randomUUID(),
    adminEmail: adminEmail || "admin",
    action: "extend_license",
    description: `Licença de "${u?.name || userId}" estendida em ${days} dias (vence em ${newExpiry.toLocaleDateString("pt-BR")})`,
    targetUserId: userId,
    targetUserEmail: u?.email || null,
    meta: JSON.stringify({ days, newExpiry: newExpiry.toISOString() }),
    createdAt: new Date(),
  })
  revalidatePath("/admin")
  return newExpiry.toISOString()
}

export async function adminRevokeAccess(userId: string, adminEmail?: string) {
  const [u] = await db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1)
  await db.update(user).set({ accessExpiresAt: new Date(0), updatedAt: new Date() }).where(eq(user.id, userId))
  await db.insert(adminLog).values({
    id: crypto.randomUUID(),
    adminEmail: adminEmail || "admin",
    action: "revoke_access",
    description: `Acesso de "${u?.name || userId}" (${u?.email || userId}) revogado imediatamente`,
    targetUserId: userId,
    targetUserEmail: u?.email || null,
    createdAt: new Date(),
  })
  revalidatePath("/admin")
}

export async function adminDeleteUser(userId: string, adminEmail?: string) {
  // Captura dados do usuário ANTES de deletar para registrar no log
  const [targetUser] = await db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1)

  // ── 1. Tabelas sem FK para user (deleção manual obrigatória) ────────────────

  // supportMessages não tem userId: deleta via ticketId dos tickets do usuário
  await db.delete(supportMessages).where(
    sql`"ticketId" IN (SELECT id FROM support_tickets WHERE "userId" = ${userId})`
  )
  await db.delete(supportTickets).where(eq(supportTickets.userId, userId))

  // activityLog não tem FK: deleta onde o usuário é dono ou funcionário
  await db.delete(activityLog).where(
    sql`"ownerId" = ${userId} OR "employeeId" = ${userId}`
  )

  // Itens de orçamento e ordem de serviço (FK para quote/serviceOrder, não para user)
  await db.delete(quoteItems).where(
    sql`"quoteId" IN (SELECT id FROM quotes WHERE "userId" = ${userId})`
  )
  await db.delete(serviceOrderItems).where(
    sql`"serviceOrderId" IN (SELECT id FROM service_orders WHERE "userId" = ${userId})`
  )

  // ── 2. Tabelas com userId direto ────────────────────────────────────────────
  await db.delete(quotes).where(eq(quotes.userId, userId))
  await db.delete(serviceOrders).where(eq(serviceOrders.userId, userId))
  await db.delete(transactions).where(eq(transactions.userId, userId))
  await db.delete(services).where(eq(services.userId, userId))
  await db.delete(clients).where(eq(clients.userId, userId))
  await db.delete(payments).where(eq(payments.userId, userId))
  await db.delete(businessProfile).where(eq(businessProfile.userId, userId))

  // Push subscriptions do dispositivo do usuário
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))

  // Vínculos de funcionário (como dono e como funcionário)
  await db.delete(employeePermissions).where(
    sql`"ownerId" = ${userId} OR "employeeId" = ${userId}`
  )
  await db.delete(employeeInvites).where(eq(employeeInvites.ownerId, userId))

  // ── 3. Tabelas com onDelete:"cascade" (session, account, verification) ──────
  // Serão limpas automaticamente pelo Postgres ao deletar o user,
  // mas deletamos explicitamente para garantir consistência em ambientes sem FK enforcement.
  await db.delete(session).where(eq(session.userId, userId))
  await db.delete(account).where(eq(account.userId, userId))
  await db.delete(verification).where(eq(verification.identifier, userId))

  // ── 4. Registro principal ──────────────────────��────────────────────────────
  await db.delete(user).where(eq(user.id, userId))

  // Log após deletar (não usa userId pois o user já foi removido)
  await db.insert(adminLog).values({
    id: crypto.randomUUID(),
    adminEmail: adminEmail || "admin",
    action: "delete_user",
    description: `Conta de "${targetUser?.name || userId}" (${targetUser?.email || userId}) excluída permanentemente`,
    targetUserId: userId,
    targetUserEmail: targetUser?.email || null,
    createdAt: new Date(),
  })

  revalidatePath("/admin")
}

export async function adminCreatePromoCode(data: {
  code: string
  planName: string
  durationMinutes: number
  expiresAt?: string
}) {
  const days = Math.floor(data.durationMinutes / 1440) // mantém coluna legada
  await db.insert(promoCodes).values({
    id: crypto.randomUUID(),
    code: data.code.toUpperCase().trim(),
    planName: data.planName,
    days,
    durationMinutes: data.durationMinutes,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
  })
  revalidatePath("/admin")
}

export async function adminGetPromoCodes() {
  const rows = await db
    .select({
      id: promoCodes.id,
      code: promoCodes.code,
      planName: promoCodes.planName,
      durationMinutes: promoCodes.durationMinutes,
      days: promoCodes.days,
      expiresAt: promoCodes.expiresAt,
      usedBy: promoCodes.usedBy,
      usedAt: promoCodes.usedAt,
      createdAt: promoCodes.createdAt,
      usedByName: user.name,
      usedByEmail: user.email,
    })
    .from(promoCodes)
    .leftJoin(user, eq(promoCodes.usedBy, user.id))
    .orderBy(desc(promoCodes.createdAt))
  return rows
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

export async function adminSendDirectMessage(userId: string, message: string) {
  // Cria um ticket de suporte de tipo "admin" e já adiciona a mensagem
  const ticketId = crypto.randomUUID()
  await db.insert(supportTickets).values({
    id: ticketId,
    userId,
    subject: "Mensagem da equipe Elevanthe",
    category: "outro",
    status: "em_andamento",
    priority: "normal",
  })
  await db.insert(supportMessages).values({
    id: crypto.randomUUID(),
    ticketId,
    authorId: "admin",
    authorRole: "admin",
    body: message,
    attachments: "[]",
  })
  revalidatePath("/admin")
  revalidatePath("/dashboard/suporte")
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

// ── Service Orders ─────────────────────────────────────────��──────────────��───
export async function getServiceOrders() {
  const { effectiveId } = await getEffectiveUserId()
  return db.select().from(serviceOrders).where(eq(serviceOrders.userId, effectiveId)).orderBy(desc(serviceOrders.createdAt))
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
  const { effectiveId } = await getEffectiveUserId()
  const number = await getNextServiceOrderNumber(effectiveId)
  const orderId = crypto.randomUUID()

  await db.insert(serviceOrders).values({
    id: orderId,
    userId: effectiveId,
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

  // Notifica o cliente por WhatsApp ao criar OS manualmente (plano Business+)
  try {
    const [profile] = await db.select().from(businessProfile).where(eq(businessProfile.userId, effectiveId)).limit(1)
    const plan = (profile?.licensePlan ?? "starter").toLowerCase()
    const hasBusinessPlus = plan === "business" || plan === "enterprise"

    if (hasBusinessPlus) {
      const [clientRow] = await db
        .select({ name: clients.name, phone: clients.phone })
        .from(clients)
        .where(eq(clients.id, data.clientId))
        .limit(1)

      if (clientRow?.phone) {
        const valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(data.total))
        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crm.elevanthe.com"
        const msg =
          `Olá, *${clientRow.name}*! 👋\n\n` +
          `*${profile?.name ?? "Prestador"}* criou uma Ordem de Serviço para você:\n\n` +
          `🔧 *${data.title}* (#${String(number).padStart(4, "0")})\n` +
          `💰 Total: *${valor}*\n\n` +
          `Acesse o recibo:\n👉 ${BASE_URL}/ordem-servico/${orderId}`
        await sendWhatsAppNotification(clientRow.phone, msg)
      }
    }
  } catch {
    // Falha silenciosa
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
  const { effectiveId } = await getEffectiveUserId()
  // Quando concluída com método de pagamento informado, marca automaticamente como pago
  const autoMarkPaid = status === "concluido" && paymentMethod != null

  await db
    .update(serviceOrders)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "concluido" ? { completedAt: new Date() } : {}),
      ...(autoMarkPaid ? { paymentStatus: "pago" } : {}),
    })
    .where(and(eq(serviceOrders.id, id), eq(serviceOrders.userId, effectiveId)))

  const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id)).limit(1)
  if (!order) { revalidatePath("/dashboard/ordens-servico"); return }

  const orderPrefix = `OS #${String(order.number).padStart(4, "0")} —`

  // Se o status foi revertido (não-concluído), remove o lançamento financeiro desta OS
  if (status !== "concluido") {
    await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.userId, effectiveId),
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
          eq(transactions.userId, effectiveId),
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
        userId: effectiveId,
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
  const { effectiveId } = await getEffectiveUserId()
  const orders = await db
    .select()
    .from(serviceOrders)
    .where(and(eq(serviceOrders.userId, effectiveId), eq(serviceOrders.clientId, clientId)))
    .orderBy(desc(serviceOrders.createdAt))
  const clientQuotes = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.userId, effectiveId), eq(quotes.clientId, clientId)))
    .orderBy(desc(quotes.createdAt))
  const txns = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, effectiveId), eq(transactions.clientId, clientId)))
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
  const hdrs = await headers()
  const sess = await auth.api.getSession({ headers: hdrs })
  if (!sess?.user) throw new Error("Não autorizado")
  const { effectiveId, isEmployee, ownerId } = await getEffectiveUserId()
  const perms = await getMyPermissions()
  if (isEmployee && !perms?.canDelete) throw new Error("Sem permissão para excluir registros.")
  const [target] = await db
    .select({ title: serviceOrders.title, number: serviceOrders.number })
    .from(serviceOrders)
    .where(and(eq(serviceOrders.id, id), eq(serviceOrders.userId, effectiveId)))
    .limit(1)

  // Remove lançamento financeiro gerado ao concluir esta OS (identificado pelo prefixo)
  if (target?.number) {
    const orderPrefix = `OS #${String(target.number).padStart(4, "0")} —`
    await db.delete(transactions).where(
      and(
        eq(transactions.userId, effectiveId),
        like(transactions.description, `${orderPrefix}%`)
      )
    )
  }

  await db.delete(serviceOrderItems).where(eq(serviceOrderItems.serviceOrderId, id))
  await db.delete(serviceOrders).where(and(eq(serviceOrders.id, id), eq(serviceOrders.userId, effectiveId)))
  if (isEmployee && ownerId) {
    logActivity({ ownerId, employeeId: sess.user.id, employeeName: sess.user.name, action: "delete", module: "ordens", description: `Excluiu a ordem de serviço "${target?.title ?? id}"`, recordId: id })
  }
  revalidatePath("/dashboard/ordens-servico")
  revalidatePath("/dashboard/financeiro")
  revalidatePath("/dashboard/relatorios")
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

// ── Reports ───────────────────────────��────────────���──────────────────────────
export async function getReportData(days: number = 30) {
  const { effectiveId } = await getEffectiveUserId()

  const now = new Date()
  const since = new Date(now)
  since.setDate(since.getDate() - days)

  const [allTransactions, allQuotes, allClients, allServices, allOrders, allOrderItems] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.userId, effectiveId)).orderBy(transactions.dueDate),
    db.select().from(quotes).where(eq(quotes.userId, effectiveId)).orderBy(desc(quotes.createdAt)),
    db.select().from(clients).where(eq(clients.userId, effectiveId)),
    db.select().from(services).where(eq(services.userId, effectiveId)),
    db.select().from(serviceOrders).where(eq(serviceOrders.userId, effectiveId)),
    db.select().from(serviceOrderItems).where(
      sql`"serviceOrderId" IN (SELECT id FROM service_orders WHERE "userId" = ${effectiveId})`
    ),
  ])

  // Filtra por período selecionado
  const periodTransactions = allTransactions.filter(t => {
    const d = new Date(t.paidAt ?? t.dueDate ?? t.createdAt)
    return d >= since
  })
  const periodQuotes = allQuotes.filter(q => new Date(q.createdAt) >= since)
  const periodOrders = allOrders.filter(o => new Date(o.createdAt) >= since)

  // Receita x Despesa por mês (últimos 6 meses — sempre exibido independente do período)
  const monthMap: Record<string, { month: string; receita: number; despesa: number }> = {}
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

  // Status dos orçamentos no período
  const quotesStatusCount: Record<string, number> = {}
  for (const q of periodQuotes) {
    quotesStatusCount[q.status] = (quotesStatusCount[q.status] ?? 0) + 1
  }
  const quotesChart = Object.entries(quotesStatusCount).map(([status, count]) => ({ status, count }))

  // Totais do período
  const totalReceita = periodTransactions.filter(t => t.type === "receita" && t.status === "pago").reduce((a, t) => a + Number(t.amount), 0)
  const totalDespesa = periodTransactions.filter(t => t.type === "despesa" && t.status === "pago").reduce((a, t) => a + Number(t.amount), 0)
  // A Receber = transações pendentes + OS com paymentStatus "pendente" não canceladas e sem transação vinculada
  const pendingTransactionTotal = allTransactions.filter(t => t.status === "pendente" && t.type === "receita").reduce((a, t) => a + Number(t.amount), 0)
  const osWithTransaction = new Set(allTransactions.filter(t => t.serviceOrderId).map(t => t.serviceOrderId))
  const osPendingTotal = allOrders
    .filter(o => o.paymentStatus !== "pago" && o.status !== "cancelado" && !osWithTransaction.has(o.id))
    .reduce((a, o) => a + Number(o.total), 0)
  const totalPendente = pendingTransactionTotal + osPendingTotal
  const totalAprovados = periodQuotes.filter(q => q.status === "aprovado").length
  const totalRecusados = periodQuotes.filter(q => q.status === "recusado").length
  const taxaConversao = periodQuotes.length > 0 ? Math.round((totalAprovados / periodQuotes.length) * 100) : 0

  // Top 5 clientes por receita no período
  const clientRevenueMap: Record<string, { name: string; total: number; ordersCount: number }> = {}
  for (const c of allClients) {
    clientRevenueMap[c.id] = { name: c.name, total: 0, ordersCount: 0 }
  }
  for (const t of periodTransactions) {
    if (t.type !== "receita" || t.status !== "pago" || !t.clientId) continue
    if (clientRevenueMap[t.clientId]) {
      clientRevenueMap[t.clientId].total += Number(t.amount)
    }
  }
  for (const o of periodOrders) {
    if (o.status === "concluido" && clientRevenueMap[o.clientId]) {
      clientRevenueMap[o.clientId].ordersCount += 1
    }
  }
  const topClientsByRevenue = Object.values(clientRevenueMap)
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Top 5 clientes por número de ordens de serviço no período
  const clientOrdersMap: Record<string, { name: string; count: number }> = {}
  for (const c of allClients) clientOrdersMap[c.id] = { name: c.name, count: 0 }
  for (const o of periodOrders) {
    if (clientOrdersMap[o.clientId]) clientOrdersMap[o.clientId].count += 1
  }
  const topClientsByOrders = Object.values(clientOrdersMap)
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Top 5 serviços mais realizados no período (por itens de OS)
  const serviceCountMap: Record<string, { name: string; count: number; revenue: number }> = {}
  const periodOrderIds = new Set(periodOrders.map(o => o.id))
  for (const item of allOrderItems) {
    if (!periodOrderIds.has(item.serviceOrderId)) continue
    const key = item.description
    if (!serviceCountMap[key]) serviceCountMap[key] = { name: key, count: 0, revenue: 0 }
    serviceCountMap[key].count += Number(item.quantity)
    serviceCountMap[key].revenue += Number(item.total)
  }
  const topServices = Object.values(serviceCountMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Orçamentos recusados com motivo no período
  const rejectedQuotes = periodQuotes
    .filter(q => q.status === "recusado")
    .map(q => ({
      number: q.number,
      title: q.title,
      total: q.total,
      rejectionReason: q.rejectionReason,
      respondedAt: q.respondedAt,
    }))

  return {
    monthlyChart,
    quotesChart,
    totalReceita,
    totalDespesa,
    totalPendente,
    totalClients: allClients.length,
    totalQuotes: periodQuotes.length,
    totalAprovados,
    totalRecusados,
    taxaConversao,
    totalServices: allServices.length,
    topClientsByRevenue,
    topClientsByOrders,
    topServices,
    rejectedQuotes,
    periodDays: days,
  }
}

// ── Dashboard Stats ────────────────────��───────────────���──────────��──────����────
export async function getDashboardStats() {
  const { effectiveId } = await getEffectiveUserId()

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
    db.select({ count: sql<number>`COUNT(*)` }).from(clients).where(eq(clients.userId, effectiveId)),
    db.select({ count: sql<number>`COUNT(*)` }).from(clients).where(and(eq(clients.userId, effectiveId), eq(clients.status, "ativo"))),
    db.select({ count: sql<number>`COUNT(*)` }).from(quotes).where(eq(quotes.userId, effectiveId)),
    db.select({ count: sql<number>`COUNT(*)` }).from(quotes).where(and(eq(quotes.userId, effectiveId), eq(quotes.status, "enviado"))),
    db.select({ count: sql<number>`COUNT(*)` }).from(quotes).where(and(eq(quotes.userId, effectiveId), eq(quotes.status, "aprovado"))),
    db.select({ sum: sql<string>`COALESCE(SUM(amount), 0)` }).from(transactions).where(and(eq(transactions.userId, effectiveId), eq(transactions.type, "receita"), eq(transactions.status, "pago"))),
    db.select({ sum: sql<string>`COALESCE(SUM(amount), 0)` }).from(transactions).where(and(eq(transactions.userId, effectiveId), eq(transactions.type, "receita"), eq(transactions.status, "pendente"))),
    db.select({ sum: sql<string>`COALESCE(SUM(amount), 0)` }).from(transactions).where(and(eq(transactions.userId, effectiveId), eq(transactions.type, "despesa"), eq(transactions.status, "pago"))),
    db.select().from(clients).where(eq(clients.userId, effectiveId)).orderBy(desc(clients.createdAt)).limit(5),
    db.select().from(quotes).where(eq(quotes.userId, effectiveId)).orderBy(desc(quotes.createdAt)).limit(5),
    db.select().from(transactions).where(eq(transactions.userId, effectiveId)),
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
      canDashboard: employeePermissions.canDashboard,
      canDelete: employeePermissions.canDelete,
      canSendQuotes: employeePermissions.canSendQuotes,
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

  // Verifica plano Enterprise e busca dados da empresa + licença
  const [profile] = await db
    .select({
      licensePlan: businessProfile.licensePlan,
      companyName: businessProfile.name,
    })
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

  // Busca data de expiração da licença Enterprise do dono
  const [payment] = await db
    .select({ expiresLicenseAt: payments.expiresLicenseAt })
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.status, "approved")))
    .orderBy(desc(payments.expiresLicenseAt))
    .limit(1)

  // Dispara e-mail de convite (falha silenciosamente para não bloquear a action)
  const inviteLink = `https://crm.elevanthe.com/aceitar-convite?token=${token}`
  const { sendEmployeeInviteEmail } = await import("@/lib/email")
  sendEmployeeInviteEmail({
    to: email.toLowerCase().trim(),
    companyName: profile?.companyName ?? "Empresa",
    inviteLink,
    expiresAt,
    licenseExpiresAt: payment?.expiresLicenseAt ?? null,
  }).catch(err => console.error("[inviteEmployee] Falha no envio do e-mail:", err))

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
  canDashboard: boolean
  canDelete: boolean
  canSendQuotes: boolean
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
    .select({ email: user.email, name: user.name })
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

  const now = new Date()

  // Marca convite como aceito
  await db
    .update(employeeInvites)
    .set({ status: "accepted", acceptedAt: now })
    .where(eq(employeeInvites.id, invite.id))

  // Notifica o prestador (dono) por e-mail — falha silenciosamente
  try {
    const [owner] = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, invite.ownerId))
      .limit(1)

    if (owner) {
      const { sendInviteAcceptedEmail } = await import("@/lib/email")
      sendInviteAcceptedEmail({
        to: owner.email,
        ownerName: owner.name ?? "Administrador",
        employeeName: invitedUser?.name ?? invitedUser?.email.split("@")[0] ?? "Funcionário",
        employeeEmail: invite.email,
        acceptedAt: now,
      }).catch(err => console.error("[acceptEmployeeInvite] Falha ao notificar prestador:", err))
    }
  } catch (notifyErr) {
    console.error("[acceptEmployeeInvite] Erro ao buscar dados do prestador para notificação:", notifyErr)
  }

  revalidatePath("/dashboard/configuracoes")
  return { ownerId: invite.ownerId }
}

// ── Aniversariantes ────────────────────────────────���──────────────────────────
// Retorna clientes ativos cujo dia e mês de nascimento cai no mês atual.
export async function getBirthdayClients() {
  const { effectiveId } = await getEffectiveUserId()
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12

  const allClients = await db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, effectiveId), eq(clients.status, "ativo")))

  return allClients.filter(c => {
    if (!c.birthdate) return false
    const d = new Date(c.birthdate)
    return (d.getUTCMonth() + 1) === currentMonth
  }).sort((a, b) => {
    const dayA = new Date(a.birthdate!).getUTCDate()
    const dayB = new Date(b.birthdate!).getUTCDate()
    return dayA - dayB
  })
}

// ── Marcar envio WhatsApp ─────────────────────────────────────────────────────
/** Grava o timestamp de envio via WhatsApp em orçamento ou OS */
export async function markWappSent(type: "quote" | "service_order", id: string) {
  const { effectiveId } = await getEffectiveUserId()
  if (type === "quote") {
    await db.update(quotes).set({ wappSentAt: new Date() } as any)
      .where(and(eq(quotes.id, id), eq(quotes.userId, effectiveId)))
  } else {
    await db.update(serviceOrders).set({ wappSentAt: new Date() } as any)
      .where(and(eq(serviceOrders.id, id), eq(serviceOrders.userId, effectiveId)))
  }
}

// ── Clientes Inativos ─────────────────────────────────────────────────────────
// Retorna clientes ativos cuja última OS ou orçamento foi criado há mais de
// `days` dias. Também inclui clientes sem nenhuma OS/orçamento (data = null).
export async function getInactiveClients(days: number = 90) {
  const { effectiveId } = await getEffectiveUserId()

  // Busca todos os clientes ativos do usuário
  const allClients = await db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, effectiveId), eq(clients.status, "ativo")))
    .orderBy(desc(clients.createdAt))

  if (allClients.length === 0) return []

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  // Para cada cliente, busca a data da última atividade (OS ou orçamento)
  const results = await Promise.all(
    allClients.map(async (client) => {
      const [lastOrder] = await db
        .select({ createdAt: serviceOrders.createdAt })
        .from(serviceOrders)
        .where(and(eq(serviceOrders.userId, effectiveId), eq(serviceOrders.clientId, client.id)))
        .orderBy(desc(serviceOrders.createdAt))
        .limit(1)

      const [lastQuote] = await db
        .select({ createdAt: quotes.createdAt })
        .from(quotes)
        .where(and(eq(quotes.userId, effectiveId), eq(quotes.clientId, client.id)))
        .orderBy(desc(quotes.createdAt))
        .limit(1)

      const dates = [lastOrder?.createdAt, lastQuote?.createdAt].filter(Boolean) as Date[]
      const lastActivityDate = dates.length > 0
        ? new Date(Math.max(...dates.map(d => new Date(d).getTime())))
        : null

      // Inclui apenas se: sem atividade alguma, ou última atividade antes do cutoff
      if (lastActivityDate === null || lastActivityDate < cutoff) {
        return { ...client, lastActivityDate }
      }
      return null
    })
  )

  return results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => {
      // Sem atividade vem primeiro, depois os mais antigos
      if (!a.lastActivityDate) return -1
      if (!b.lastActivityDate) return 1
      return new Date(a.lastActivityDate).getTime() - new Date(b.lastActivityDate).getTime()
    })
}

// ── SaaS Config ────────────────────────────��──────────────────────────────────
export async function getSaasConfig() {
  const rows = await db.select().from(saasConfig).where(eq(saasConfig.id, "singleton")).limit(1)
  if (rows.length === 0) {
    // Cria o registro singleton se não existir
    await db.insert(saasConfig).values({ id: "singleton" }).onConflictDoNothing()
    return { id: "singleton", maintenanceMode: false, supportEmail: "suporte@elevanthe.com", maxClientsStarter: 50, maxClientsProf: 300, maxOsStarter: 100, trialDays: 0, updatedAt: new Date() }
  }
  return rows[0]
}

export async function adminSaveSaasConfig(data: {
  maintenanceMode: boolean
  supportEmail: string
  maxClientsStarter: number
  maxClientsProf: number
  maxOsStarter: number
  trialDays: number
}) {
  await db
    .insert(saasConfig)
    .values({ id: "singleton", ...data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: saasConfig.id,
      set: { ...data, updatedAt: new Date() },
    })
  return { ok: true }
}

// ── Patch Notes ───────────────────────────────────────────────────────────────

/** Busca todas as notas publicadas (para os usuários do SaaS). Não requer auth. */
export async function getPatchNotes() {
  return db
    .select()
    .from(patchNotes)
    .where(eq(patchNotes.published, true))
    .orderBy(desc(patchNotes.createdAt))
}

/** Busca todas as notas (publicadas + rascunhos) para o painel admin. */
export async function adminGetPatchNotes() {
  return db.select().from(patchNotes).orderBy(desc(patchNotes.createdAt))
}

/** Cria uma nova patch note (admin). */
export async function adminCreatePatchNote(data: {
  version: string
  title: string
  body: string
  type: string
  published: boolean
}) {
  const { nanoid } = await import("nanoid")
  const id = nanoid()
  await db.insert(patchNotes).values({
    id,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  revalidatePath("/dashboard/atualizacoes")
  return { ok: true, id }
}

/** Atualiza uma patch note existente (admin). */
export async function adminUpdatePatchNote(id: string, data: {
  version?: string
  title?: string
  body?: string
  type?: string
  published?: boolean
}) {
  await db
    .update(patchNotes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(patchNotes.id, id))
  revalidatePath("/dashboard/atualizacoes")
  return { ok: true }
}

/** Remove uma patch note (admin). */
export async function adminDeletePatchNote(id: string) {
  await db.delete(patchNotes).where(eq(patchNotes.id, id))
  revalidatePath("/dashboard/atualizacoes")
  return { ok: true }
}

/** Salva a meta mensal de faturamento do prestador (em centavos para evitar float). */
export async function saveRevenueGoal(goalCents: number) {
  const { effectiveId } = await getEffectiveUserId()
  await db.update(businessProfile)
    .set({ revenueGoal: goalCents, updatedAt: new Date() })
    .where(eq(businessProfile.userId, effectiveId))
  revalidatePath("/dashboard")
  return { ok: true }
}

/** Retorna a meta mensal de faturamento do prestador (em centavos). */
export async function getRevenueGoal(): Promise<number | null> {
  const { effectiveId } = await getEffectiveUserId()
  const [profile] = await db
    .select({ revenueGoal: businessProfile.revenueGoal })
    .from(businessProfile)
    .where(eq(businessProfile.userId, effectiveId))
    .limit(1)
  return profile?.revenueGoal ?? null
}

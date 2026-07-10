import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { serviceOrders, clients, businessProfile } from "@/lib/db/schema"
import { and, eq, isNull, isNotNull, lte, ne, sql } from "drizzle-orm"
import { sendWhatsApp, msgLembreteCobranca } from "@/lib/whatsapp"

/**
 * Cron job: envia lembrete de cobrança para clientes com OS "A Pagar" há 3+ dias.
 * Deve ser chamado diariamente via Vercel Cron.
 * GET /api/cron/cobranca
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crm.elevanthe.com"

  // Busca OS com status concluido e paymentStatus pendente, criadas há 3+ dias
  // que pertençam a prestadores Business+ com número WhatsApp verificado
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const ordensAbertas = await db
    .select({
      osId: serviceOrders.id,
      osNumber: serviceOrders.number,
      osTitle: serviceOrders.title,
      osTotal: serviceOrders.total,
      osCreatedAt: serviceOrders.createdAt,
      osPaymentStatus: serviceOrders.paymentStatus,
      clientId: serviceOrders.clientId,
      userId: serviceOrders.userId,
    })
    .from(serviceOrders)
    .where(
      and(
        eq(serviceOrders.status, "concluido"),
        eq(serviceOrders.paymentStatus, "pendente"),
        lte(serviceOrders.createdAt, threeDaysAgo)
      )
    )

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const os of ordensAbertas) {
    // Carrega prestador (verifica plano e WhatsApp)
    const [profile] = await db
      .select()
      .from(businessProfile)
      .where(eq(businessProfile.userId, os.userId))
      .limit(1)

    const plan = (profile?.licensePlan ?? "starter").toLowerCase()
    const hasBusinessPlus = plan === "business" || plan === "enterprise"
    if (!hasBusinessPlus || !profile?.whatsappPhone) { skipped++; continue }

    // Carrega cliente
    const [client] = await db
      .select({ name: clients.name, phone: clients.phone })
      .from(clients)
      .where(eq(clients.id, os.clientId))
      .limit(1)

    if (!client?.phone) { skipped++; continue }

    const daysOverdue = Math.floor(
      (Date.now() - new Date(os.osCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    const msg = msgLembreteCobranca({
      clientName: client.name.split(" ")[0],
      providerName: profile.name ?? "Prestador",
      osTitle: os.osTitle,
      osNumber: os.osNumber,
      total: Number(os.osTotal),
      daysOverdue,
      receiptLink: `${BASE_URL}/ordem-servico/${os.osId}`,
    })

    const ok = await sendWhatsApp(client.phone, msg)
    if (ok) sent++
    else failed++
  }

  return NextResponse.json({
    ok: true,
    processed: ordensAbertas.length,
    sent,
    skipped,
    failed,
    checkedAt: new Date().toISOString(),
  })
}

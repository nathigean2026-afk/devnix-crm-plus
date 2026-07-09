import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user, businessProfile } from "@/lib/db/schema"
import { eq, and, isNotNull, sql } from "drizzle-orm"
import { sendWhatsApp, msgPlanoExpirando } from "@/lib/whatsapp"

/**
 * Cron job: notifica prestadores com plano expirando em 7 ou 1 dia.
 * Deve ser chamado diariamente via Vercel Cron ou serviço externo.
 * GET /api/cron/license-expiry
 * Header obrigatório: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  // Valida secret para evitar chamadas não autorizadas
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  // Janelas de alerta: notifica quando faltam exatamente 7 ou 1 dia
  const in7days = new Date(now)
  in7days.setDate(in7days.getDate() + 7)
  const in1day = new Date(now)
  in1day.setDate(in1day.getDate() + 1)

  // Formata como YYYY-MM-DD para comparar com accessExpiresAt (date no banco)
  function toDateStr(d: Date) {
    return d.toISOString().slice(0, 10)
  }

  const targets7 = toDateStr(in7days)
  const targets1 = toDateStr(in1day)

  // Busca usuários com licença expirando em 7 ou 1 dia que tenham WhatsApp cadastrado
  const rows = await db
    .select({
      userId: user.id,
      userName: user.name,
      accessExpiresAt: user.accessExpiresAt,
      whatsappPhone: businessProfile.whatsappPhone,
      profileName: businessProfile.name,
      wappNotifLicense: businessProfile.wappNotifLicense,
    })
    .from(user)
    .innerJoin(businessProfile, eq(businessProfile.userId, user.id))
    .where(
      and(
        isNotNull(businessProfile.whatsappPhone),
        eq(businessProfile.wappNotifLicense, true),
        sql`DATE(${user.accessExpiresAt}) IN (${targets7}::date, ${targets1}::date)`
      )
    )

  let sent = 0
  let failed = 0

  for (const row of rows) {
    if (!row.whatsappPhone || !row.accessExpiresAt) continue

    const expDate = new Date(row.accessExpiresAt)
    const diffMs = expDate.getTime() - now.getTime()
    const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24))

    const providerName = row.profileName || row.userName
    const msg = msgPlanoExpirando({ daysLeft, providerName })

    const ok = await sendWhatsApp(row.whatsappPhone, msg)
    if (ok) sent++
    else failed++
  }

  return NextResponse.json({
    ok: true,
    processed: rows.length,
    sent,
    failed,
    checkedAt: now.toISOString(),
  })
}

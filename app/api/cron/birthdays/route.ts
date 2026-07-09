import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clients, businessProfile, user } from "@/lib/db/schema"
import { eq, and, isNotNull, sql } from "drizzle-orm"
import { sendWhatsApp, msgAniversariantesDiario } from "@/lib/whatsapp"

/**
 * Cron job: avisa o prestador sobre clientes que fazem aniversário hoje.
 * Deve ser chamado diariamente às 8h via Vercel Cron.
 * GET /api/cron/birthdays
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Aniversariantes de hoje: compara mês e dia ignorando o ano
  const today = new Date()
  const month = today.getMonth() + 1 // 1-12
  const day = today.getDate()

  // Busca todos os prestadores com WhatsApp cadastrado e notif de aniversário ativa
  const prestadores = await db
    .select({
      userId: businessProfile.userId,
      profileName: businessProfile.name,
      whatsappPhone: businessProfile.whatsappPhone,
      wappNotifBirthday: businessProfile.wappNotifBirthday,
    })
    .from(businessProfile)
    .where(
      and(
        isNotNull(businessProfile.whatsappPhone),
        eq(businessProfile.wappNotifBirthday, true)
      )
    )

  let totalSent = 0
  let totalFailed = 0
  const results: Array<{ userId: string; aniversariantes: number; sent: boolean }> = []

  for (const prestador of prestadores) {
    if (!prestador.whatsappPhone) continue

    // Busca clientes do prestador que fazem aniversário hoje
    const aniversariantes = await db
      .select({
        name: clients.name,
        phone: clients.phone,
      })
      .from(clients)
      .where(
        and(
          eq(clients.userId, prestador.userId),
          eq(clients.status, "ativo"),
          isNotNull(clients.birthdate),
          sql`EXTRACT(MONTH FROM ${clients.birthdate}::date) = ${month}`,
          sql`EXTRACT(DAY FROM ${clients.birthdate}::date) = ${day}`
        )
      )

    if (aniversariantes.length === 0) {
      results.push({ userId: prestador.userId, aniversariantes: 0, sent: false })
      continue
    }

    const msg = msgAniversariantesDiario({
      providerName: prestador.profileName ?? "Prestador",
      aniversariantes,
    })

    if (!msg) continue

    const ok = await sendWhatsApp(prestador.whatsappPhone, msg)
    if (ok) totalSent++
    else totalFailed++

    results.push({ userId: prestador.userId, aniversariantes: aniversariantes.length, sent: ok })
  }

  return NextResponse.json({
    ok: true,
    date: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
    prestadoresVerificados: prestadores.length,
    notificacoesSent: totalSent,
    notificacoesFailed: totalFailed,
    results,
  })
}

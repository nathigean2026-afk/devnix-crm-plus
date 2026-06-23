import { NextRequest, NextResponse } from "next/server"
import MercadoPagoConfig, { Payment } from "mercadopago"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MP envia notificacoes de varios tipos — so nos interessa "payment"
    if (body.type !== "payment") {
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ received: true })
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })

    const paymentClient = new Payment(client)
    const payment = await paymentClient.get({ id: paymentId })

    // So ativa se pagamento estiver aprovado
    if (payment.status !== "approved") {
      return NextResponse.json({ received: true })
    }

    const userId = payment.metadata?.user_id
    const durationDays = Number(payment.metadata?.duration_days)

    if (!userId || !durationDays) {
      console.error("[MP Webhook] Metadados ausentes:", payment.metadata)
      return NextResponse.json({ error: "Metadados invalidos" }, { status: 400 })
    }

    // Calcula nova data de expiracao (adiciona sobre a existente se ainda valida)
    const [existingUser] = await db
      .select({ accessExpiresAt: user.accessExpiresAt })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    const baseDate =
      existingUser?.accessExpiresAt && existingUser.accessExpiresAt > new Date()
        ? existingUser.accessExpiresAt
        : new Date()

    const newExpiry = new Date(baseDate)
    newExpiry.setDate(newExpiry.getDate() + durationDays)

    await db.update(user).set({ accessExpiresAt: newExpiry }).where(eq(user.id, userId))

    console.log(`[MP Webhook] Licenca ativada para ${userId} ate ${newExpiry.toISOString()}`)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[MP Webhook] Erro:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

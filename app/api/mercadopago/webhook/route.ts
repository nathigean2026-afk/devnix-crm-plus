import { NextRequest, NextResponse } from "next/server"
import MercadoPagoConfig, { Payment } from "mercadopago"
import { db } from "@/lib/db"
import { user, payments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { LICENSE_PLANS } from "@/lib/products"

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

    const userId = payment.metadata?.user_id
    const durationDays = Number(payment.metadata?.duration_days ?? 30)
    const planId = payment.metadata?.plan_id ?? "unknown"
    const plan = LICENSE_PLANS.find((p) => p.id === planId)
    const amountCents = Math.round((payment.transaction_amount ?? 0) * 100)
    const paymentMethod = payment.payment_method_id ?? "pix"
    const mpStatus = payment.status ?? "pending"

    // Salva ou atualiza registro do pagamento
    const paymentRowId = `mp_${paymentId}`
    await db
      .insert(payments)
      .values({
        id: paymentRowId,
        userId: userId ?? "unknown",
        mpPaymentId: String(paymentId),
        planId,
        planName: plan?.name ?? planId,
        amountCents,
        status: mpStatus,
        paymentMethod,
        durationDays,
        paidAt: mpStatus === "approved" ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: payments.mpPaymentId,
        set: {
          status: mpStatus,
          paidAt: mpStatus === "approved" ? new Date() : null,
          updatedAt: new Date(),
        },
      })

    // So ativa licenca se pagamento estiver aprovado
    if (payment.status !== "approved") {
      return NextResponse.json({ received: true })
    }

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

    // Atualiza licenca do usuario e plano no businessProfile
    await db
      .update(user)
      .set({ accessExpiresAt: newExpiry, updatedAt: new Date() })
      .where(eq(user.id, userId))

    // Atualiza expiresLicenseAt no registro do pagamento
    await db
      .update(payments)
      .set({ expiresLicenseAt: newExpiry, updatedAt: new Date() })
      .where(eq(payments.mpPaymentId, String(paymentId)))

    console.log(`[MP Webhook] Licenca ativada para ${userId} ate ${newExpiry.toISOString()}`)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[MP Webhook] Erro:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

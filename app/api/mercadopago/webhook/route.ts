import { NextRequest, NextResponse } from "next/server"
import MercadoPagoConfig, { Payment } from "mercadopago"
import { db } from "@/lib/db"
import { user, payments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { LICENSE_PLANS } from "@/lib/products"
import { sendPurchaseConfirmationEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

const mpClient = () =>
  new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })

// Ativa licenca e salva registro de pagamento para um payment do MP
async function activateLicense(payment: Awaited<ReturnType<Payment["get"]>>) {
  const userId = payment.metadata?.user_id
  const durationDays = Number(payment.metadata?.duration_days ?? 30)
  const planId = payment.metadata?.plan_id ?? "unknown"
  const plan = LICENSE_PLANS.find((p) => p.id === planId)
  const amountCents = Math.round((payment.transaction_amount ?? 0) * 100)
  const paymentMethod = payment.payment_method_id ?? "unknown"
  const mpStatus = payment.status ?? "pending"
  const paymentId = String(payment.id)

  // Salva ou atualiza registro na tabela payments
  await db
    .insert(payments)
    .values({
      id: `mp_${paymentId}`,
      userId: userId ?? "unknown",
      mpPaymentId: paymentId,
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
        paymentMethod,
        paidAt: mpStatus === "approved" ? new Date() : null,
        updatedAt: new Date(),
      },
    })

  if (mpStatus !== "approved" || !userId) return

  // Calcula nova data de expiracao — adiciona sobre existente se ainda valida
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

  await db
    .update(user)
    .set({ accessExpiresAt: newExpiry, updatedAt: new Date() })
    .where(eq(user.id, userId))

  await db
    .update(payments)
    .set({ expiresLicenseAt: newExpiry, updatedAt: new Date() })
    .where(eq(payments.mpPaymentId, paymentId))

  console.log(`[MP Webhook] Licenca ativada para ${userId} ate ${newExpiry.toISOString()} via ${paymentMethod}`)

  // Envia email de confirmacao de compra
  try {
    const [userData] = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (userData?.email) {
      await sendPurchaseConfirmationEmail({
        to: userData.email,
        userName: userData.name ?? "Cliente",
        planName: plan?.name ?? planId,
        planId,
        amountCents,
        durationDays,
        purchasedAt: new Date(),
        expiresAt: newExpiry,
      })
    }
  } catch (emailErr) {
    // Nao quebra o fluxo de ativacao se o email falhar
    console.error("[MP Webhook] Falha ao enviar email de confirmacao:", emailErr)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const paymentClient = new Payment(mpClient())

    // merchant_order: vindo do Checkout Pro (cartao, boleto)
    if (body.type === "merchant_order") {
      const orderId = body.data?.id
      if (!orderId) return NextResponse.json({ received: true })

      const orderRes = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN!}` },
      })
      if (!orderRes.ok) return NextResponse.json({ received: true })

      const order = await orderRes.json()
      for (const p of (order.payments ?? [])) {
        if (p.status === "approved") {
          const fullPayment = await paymentClient.get({ id: p.id })
          await activateLicense(fullPayment)
        }
      }
      return NextResponse.json({ received: true })
    }

    // payment: notificacao direta (PIX)
    if (body.type !== "payment") return NextResponse.json({ received: true })

    const paymentId = body.data?.id
    if (!paymentId) return NextResponse.json({ received: true })

    const payment = await paymentClient.get({ id: paymentId })
    await activateLicense(payment)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[MP Webhook] Erro:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

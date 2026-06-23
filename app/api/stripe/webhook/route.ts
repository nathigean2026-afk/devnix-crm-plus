import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Falta assinatura ou webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error("[webhook] Assinatura invalida:", err)
    return NextResponse.json({ error: "Assinatura invalida" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    // Pagamento confirmado
    if (session.payment_status === "paid") {
      const { userId, durationDays } = session.metadata ?? {}

      if (!userId || !durationDays) {
        console.error("[webhook] Metadata ausente:", session.metadata)
        return NextResponse.json({ error: "Metadata ausente" }, { status: 400 })
      }

      const days = parseInt(durationDays, 10)
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + days)

      await db
        .update(user)
        .set({ accessExpiresAt: expiresAt })
        .where(eq(user.id, userId))

      console.log(`[webhook] Licenca ativada para userId=${userId} por ${days} dias. Expira em ${expiresAt.toISOString()}`)
    }
  }

  return NextResponse.json({ received: true })
}

// No App Router, lemos o body como texto manualmente (req.text())
// A config de bodyParser do Pages Router nao se aplica aqui
export const dynamic = "force-dynamic"

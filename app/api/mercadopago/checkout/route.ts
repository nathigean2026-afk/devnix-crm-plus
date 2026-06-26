import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { LICENSE_PLANS } from "@/lib/products"
import { db } from "@/lib/db"
import { payments } from "@/lib/db/schema"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { planId } = await req.json()
    const plan = LICENSE_PLANS.find((p) => p.id === planId)
    if (!plan) {
      return NextResponse.json({ error: "Plano invalido" }, { status: 400 })
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!
    const baseUrl = req.nextUrl.origin
    const isPublicUrl = baseUrl.startsWith("https://") && !baseUrl.includes("localhost")

    // Cria preferencia de pagamento — o MP abre o checkout completo com cartao, PIX e boleto
    const preferenceBody: Record<string, unknown> = {
      items: [
        {
          id: plan.id,
          title: plan.name,
          description: plan.description,
          quantity: 1,
          currency_id: "BRL",
          unit_price: plan.priceInCents / 100,
        },
      ],
      // NAO enviar payer.email — quando o email do comprador coincide com o
      // email da conta vendedora do MP, o botao de pagamento fica inativo.
      // O MP solicita o email ao comprador diretamente no checkout.
      external_reference: session.user.id,
      payment_methods: {
        // Aceita PIX, cartao de credito e boleto
        excluded_payment_types: [],
        installments: 12,
      },
      metadata: {
        user_id: session.user.id,
        plan_id: plan.id,
        duration_days: String(plan.durationDays),
      },
      // URLs de retorno apos o pagamento
      back_urls: {
        success: `${baseUrl}/planos/sucesso`,
        failure: `${baseUrl}/planos`,
        pending: `${baseUrl}/planos/sucesso`,
      },
      auto_return: "approved",
      statement_descriptor: "DEVNIX CRM PLUS",
    }

    if (isPublicUrl) {
      preferenceBody.notification_url = `${baseUrl}/api/mercadopago/webhook`
    }

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": `pref-${session.user.id}-${planId}-${Date.now()}`,
      },
      body: JSON.stringify(preferenceBody),
    })

    const result = await mpRes.json()

    if (!mpRes.ok) {
      console.error("[MP Checkout] erro:", JSON.stringify(result))
      return NextResponse.json({ error: result?.message ?? "Erro ao criar preferencia" }, { status: 400 })
    }

    // Registra pagamento como pending para rastreamento no admin
    const tempId = `pref_${result.id}`
    try {
      await db.insert(payments).values({
        id: tempId,
        userId: session.user.id,
        mpPaymentId: tempId,
        planId: plan.id,
        planName: plan.name,
        amountCents: plan.priceInCents,
        status: "pending",
        paymentMethod: "checkout_pro",
        durationDays: plan.durationDays,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing()
    } catch { /* nao bloqueia o checkout */ }

    return NextResponse.json({
      preferenceId: result.id,
      initPoint: result.init_point,
    })
  } catch (err) {
    console.error("[MP Checkout] erro:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

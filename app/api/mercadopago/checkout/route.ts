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
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { planId } = await req.json()
    const plan = LICENSE_PLANS.find((p) => p.id === planId)
    if (!plan) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 })
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error("[v0] MP Checkout: MERCADOPAGO_ACCESS_TOKEN não definido")
      return NextResponse.json({ error: "Configuração de pagamento ausente" }, { status: 500 })
    }

    // Prioridade: 1) BETTER_AUTH_URL (canonical) 2) VERCEL_PROJECT_PRODUCTION_URL 3) req.nextUrl.origin
    const canonicalUrl =
      process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null)
    const requestOrigin = req.nextUrl.origin
    const baseUrl = canonicalUrl ?? requestOrigin
    const isPublicUrl = baseUrl.startsWith("https://") && !baseUrl.includes("localhost")

    // back_urls exige HTTPS para o MP aceitar auto_return.
    // Em desenvolvimento local a URL não é pública — usamos o domínio de produção como fallback.
    const publicBase = isPublicUrl ? baseUrl : "https://crm.elevanthe.com"
    const backUrls = {
      success: `${publicBase}/planos/sucesso`,
      failure: `${publicBase}/planos`,
      pending: `${publicBase}/planos/sucesso`,
    }

    // Cria preferência de pagamento — o MP abre o checkout completo com cartão, Pix e boleto
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
      // NAO enviar payer.email — quando o e-mail do comprador coincide com o
      // e-mail da conta vendedora do MP, o botão de pagamento fica inativo.
      external_reference: session.user.id,
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
      metadata: {
        user_id: session.user.id,
        plan_id: plan.id,
        duration_days: String(plan.durationDays),
      },
      back_urls: backUrls,
      statement_descriptor: "DEVNIX CRM PLUS",
    }

    // auto_return só funciona com back_urls HTTPS válidas
    if (isPublicUrl) {
      preferenceBody.auto_return = "approved"
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
      console.error("[v0] MP Checkout erro:", JSON.stringify(result))
      return NextResponse.json({ error: result?.message ?? "Erro ao criar preferência" }, { status: 400 })
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
    } catch (dbErr) {
      console.error("[v0] MP Checkout: erro ao inserir payment no DB:", dbErr)
    }

    return NextResponse.json({
      preferenceId: result.id,
      initPoint: result.init_point,
    })
  } catch (err) {
    console.error("[MP Checkout] erro:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

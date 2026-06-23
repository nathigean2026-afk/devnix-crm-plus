"use server"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { LICENSE_PLANS } from "@/lib/products"
import MercadoPagoConfig, { Payment } from "mercadopago"

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

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })

    const payment = new Payment(client)

    const baseUrl = req.nextUrl.origin
    // notification_url so e valida quando e uma URL HTTPS publica (producao)
    // Em preview/localhost o MP rejeita com erro 4020
    const isPublicUrl = baseUrl.startsWith("https://") && !baseUrl.includes("localhost")

    const result = await payment.create({
      body: {
        transaction_amount: plan.priceInCents / 100,
        description: plan.name,
        payment_method_id: "pix",
        payer: {
          email: session.user.email,
          first_name: session.user.name?.split(" ")[0] ?? "Cliente",
          last_name: session.user.name?.split(" ").slice(1).join(" ") ?? "",
        },
        ...(isPublicUrl ? { notification_url: `${baseUrl}/api/mercadopago/webhook` } : {}),
        metadata: {
          user_id: session.user.id,
          plan_id: plan.id,
          duration_days: String(plan.durationDays),
        },
      },
    })

    const pixData = result.point_of_interaction?.transaction_data

    return NextResponse.json({
      paymentId: result.id,
      qrCode: pixData?.qr_code,
      qrCodeBase64: pixData?.qr_code_base64,
      expiresAt: result.date_of_expiration,
    })
  } catch (err) {
    console.error("[MP Pix] Erro ao gerar pagamento:", err)
    return NextResponse.json({ error: "Erro ao gerar Pix" }, { status: 500 })
  }
}

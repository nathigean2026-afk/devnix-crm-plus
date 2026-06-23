import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { LICENSE_PLANS } from "@/lib/products"

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

    const body: Record<string, unknown> = {
      transaction_amount: plan.priceInCents / 100,
      description: plan.name,
      payment_method_id: "pix",
      payer: {
        email: session.user.email,
        first_name: session.user.name?.split(" ")[0] ?? "Cliente",
        last_name: session.user.name?.split(" ").slice(1).join(" ") ?? "",
      },
      metadata: {
        user_id: session.user.id,
        plan_id: plan.id,
        duration_days: String(plan.durationDays),
      },
    }

    if (isPublicUrl) {
      body.notification_url = `${baseUrl}/api/mercadopago/webhook`
    }

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": `${session.user.id}-${planId}-${Date.now()}`,
      },
      body: JSON.stringify(body),
    })

    const result = await mpRes.json()

    if (!mpRes.ok) {
      console.error("[v0] MP API error:", JSON.stringify(result))
      return NextResponse.json({ error: result?.message ?? "Erro MP" }, { status: 400 })
    }

    const pixData = result?.point_of_interaction?.transaction_data

    return NextResponse.json({
      paymentId: result.id,
      qrCode: pixData?.qr_code ?? null,
      qrCodeBase64: pixData?.qr_code_base64 ?? null,
      expiresAt: result.date_of_expiration ?? null,
    })
  } catch (err) {
    console.error("[v0] MP Pix erro:", err)
    return NextResponse.json({ error: "Erro ao gerar Pix" }, { status: 500 })
  }
}

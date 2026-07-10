import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { businessProfile } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendWhatsApp } from "@/lib/whatsapp"

/**
 * POST /api/whatsapp/send-doc
 * Envia um documento (recibo, orçamento, OS) via WhatsApp diretamente pelo Wame
 * para o número do CLIENTE, usando a conta do prestador.
 *
 * Requer:
 * - Plano Business ou Enterprise
 * - whatsappPhone cadastrado nas configurações
 * - WAME_API_KEY configurado
 */
export async function POST(req: NextRequest) {
  try {
    const sess = await auth.api.getSession({ headers: await headers() })
    if (!sess?.user) return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 })

    const body = await req.json()
    const { phone, message } = body as { phone?: string; message?: string }

    if (!phone || !message) {
      return NextResponse.json({ ok: false, error: "phone e message são obrigatórios" }, { status: 400 })
    }

    // Busca perfil do prestador (ou dono, se for funcionário)
    const userId = sess.user.id
    const [profile] = await db
      .select({
        licensePlan: businessProfile.licensePlan,
        whatsappPhone: businessProfile.whatsappPhone,
      })
      .from(businessProfile)
      .where(eq(businessProfile.userId, userId))
      .limit(1)

    const plan = (profile?.licensePlan ?? "starter").toLowerCase()
    const isPaidPlan = plan === "business" || plan === "enterprise"

    if (!isPaidPlan) {
      return NextResponse.json({ ok: false, reason: "plan_not_eligible" }, { status: 403 })
    }

    if (!profile?.whatsappPhone) {
      return NextResponse.json({ ok: false, reason: "no_whatsapp_configured" }, { status: 403 })
    }

    // Tenta enviar via Wame
    const sent = await sendWhatsApp(phone, message)
    if (sent) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, reason: "wame_failed" }, { status: 502 })
  } catch (err) {
    console.error("[send-doc] Erro:", err)
    return NextResponse.json({ ok: false, error: "Erro interno" }, { status: 500 })
  }
}

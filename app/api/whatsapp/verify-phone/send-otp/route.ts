import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { businessProfile, whatsappOtp } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { sendWhatsApp } from "@/lib/whatsapp"

const COOLDOWN_DAYS = 2
const OTP_EXPIRY_MINUTES = 10

export async function POST(req: NextRequest) {
  try {
    const sess = await auth.api.getSession({ headers: await headers() })
    if (!sess?.user) return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 })

    const { phone } = await req.json() as { phone?: string }
    if (!phone) return NextResponse.json({ ok: false, error: "Número obrigatório" }, { status: 400 })

    const digits = phone.replace(/\D/g, "")
    if (digits.length < 10 || digits.length > 11) {
      return NextResponse.json({ ok: false, error: "Número inválido. Use DDD + número (ex: 11999990000)" }, { status: 400 })
    }

    const userId = sess.user.id

    // Verifica cooldown — não pode trocar por 2 dias após última troca
    const [profile] = await db
      .select({ whatsappPhone: businessProfile.whatsappPhone, whatsappChangedAt: businessProfile.whatsappChangedAt })
      .from(businessProfile)
      .where(eq(businessProfile.userId, userId))
      .limit(1)

    if (profile?.whatsappChangedAt) {
      const msPerDay = 1000 * 60 * 60 * 24
      const daysSinceChange = (Date.now() - new Date(profile.whatsappChangedAt).getTime()) / msPerDay
      if (daysSinceChange < COOLDOWN_DAYS && profile.whatsappPhone && profile.whatsappPhone !== digits) {
        const hoursLeft = Math.ceil((COOLDOWN_DAYS * 24) - daysSinceChange * 24)
        return NextResponse.json({
          ok: false,
          error: `Você só pode alterar o número de WhatsApp após ${hoursLeft}h (cooldown de ${COOLDOWN_DAYS} dias).`,
          reason: "cooldown",
          hoursLeft,
        }, { status: 429 })
      }
    }

    // Remove OTPs antigos deste usuário
    await db.delete(whatsappOtp).where(eq(whatsappOtp.userId, userId))

    // Gera código de 6 dígitos
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    await db.insert(whatsappOtp).values({
      id: crypto.randomUUID(),
      userId,
      phone: digits,
      code,
      expiresAt,
    })

    // Envia via Wame
    const message = `*Elevanthe CRM* — Seu código de verificação é: *${code}*\n\nEle expira em ${OTP_EXPIRY_MINUTES} minutos. Não compartilhe este código com ninguém.`
    const sent = await sendWhatsApp(digits, message)

    if (!sent) {
      return NextResponse.json({ ok: false, error: "Não foi possível enviar o código. Verifique se o número está correto e tente novamente." }, { status: 502 })
    }

    return NextResponse.json({ ok: true, expiresInMinutes: OTP_EXPIRY_MINUTES })
  } catch (err) {
    console.error("[send-otp] Erro:", err)
    return NextResponse.json({ ok: false, error: "Erro interno" }, { status: 500 })
  }
}

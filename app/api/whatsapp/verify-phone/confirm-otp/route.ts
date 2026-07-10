import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { businessProfile, whatsappOtp } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const sess = await auth.api.getSession({ headers: await headers() })
    if (!sess?.user) return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 })

    const { code } = await req.json() as { code?: string }
    if (!code) return NextResponse.json({ ok: false, error: "Código obrigatório" }, { status: 400 })

    const userId = sess.user.id
    const now = new Date()

    // Busca OTP válido
    const [otp] = await db
      .select()
      .from(whatsappOtp)
      .where(
        and(
          eq(whatsappOtp.userId, userId),
          eq(whatsappOtp.code, code.trim()),
          gt(whatsappOtp.expiresAt, now),
        )
      )
      .limit(1)

    if (!otp) {
      return NextResponse.json({ ok: false, error: "Código inválido ou expirado." }, { status: 400 })
    }

    // Salva o número verificado no perfil
    await db.update(businessProfile)
      .set({
        whatsappPhone: otp.phone,
        whatsappVerifiedAt: now,
        whatsappChangedAt: now,
        updatedAt: now,
      })
      .where(eq(businessProfile.userId, userId))

    // Remove o OTP usado
    await db.delete(whatsappOtp).where(eq(whatsappOtp.id, otp.id))

    return NextResponse.json({ ok: true, phone: otp.phone })
  } catch (err) {
    console.error("[confirm-otp] Erro:", err)
    return NextResponse.json({ ok: false, error: "Erro interno" }, { status: 500 })
  }
}

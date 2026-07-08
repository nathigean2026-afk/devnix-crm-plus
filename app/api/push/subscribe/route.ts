import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { pushSubscriptions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { endpoint, keys } = body

    console.log("[push/subscribe] userId:", session.user.id, "endpoint:", endpoint?.slice(0, 60))

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      console.error("[push/subscribe] Campos ausentes — endpoint:", !!endpoint, "p256dh:", !!keys?.p256dh, "auth:", !!keys?.auth)
      return NextResponse.json({ error: "Subscription inválida" }, { status: 400 })
    }

    // Upsert real: se o endpoint já existe, atualiza userId e chaves (caso tenham mudado)
    const existing = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(pushSubscriptions)
        .set({ userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth })
        .where(eq(pushSubscriptions.endpoint, endpoint))
      console.log("[push/subscribe] Subscription atualizada para userId:", session.user.id)
      return NextResponse.json({ ok: true, action: "updated" })
    }

    await db.insert(pushSubscriptions).values({
      id: nanoid(),
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: req.headers.get("user-agent") ?? undefined,
    })
    console.log("[push/subscribe] Nova subscription salva para userId:", session.user.id)

    return NextResponse.json({ ok: true, action: "subscribed" })
  } catch (err) {
    console.error("[push/subscribe] Erro:", err)
    return NextResponse.json({ error: "Erro ao salvar subscription" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { endpoint } = await req.json()
    if (!endpoint) return NextResponse.json({ error: "Endpoint ausente" }, { status: 400 })

    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[push/unsubscribe]", err)
    return NextResponse.json({ error: "Erro ao remover subscription" }, { status: 500 })
  }
}

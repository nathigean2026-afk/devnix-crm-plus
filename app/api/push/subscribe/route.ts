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

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Subscription inválida" }, { status: 400 })
    }

    // Upsert — se endpoint já existe, atualiza; senão insere
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ ok: true, action: "already_exists" })
    }

    await db.insert(pushSubscriptions).values({
      id: nanoid(),
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: req.headers.get("user-agent") ?? undefined,
    })

    return NextResponse.json({ ok: true, action: "subscribed" })
  } catch (err) {
    console.error("[push/subscribe]", err)
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

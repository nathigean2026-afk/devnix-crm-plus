import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { pushSubscriptions, pushNotifications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import webpush from "web-push"
import { nanoid } from "nanoid"

webpush.setVapidDetails(
  process.env.VAPID_EMAIL ?? "mailto:suporte@elevanthe.com.br",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { title, body, url, type } = await req.json()

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Título e mensagem são obrigatórios" }, { status: 400 })
    }

    const subs = await db.select().from(pushSubscriptions)

    if (subs.length === 0) {
      return NextResponse.json({ error: "Nenhum dispositivo inscrito" }, { status: 400 })
    }

    const payload = JSON.stringify({
      title: title.trim(),
      body: body.trim(),
      url: url ?? "/dashboard",
      type: type ?? "info",
      icon: "/pwa-icon-192.png",
      badge: "/pwa-icon-192.png",
    })

    let totalSent = 0
    let totalFailed = 0
    const staleEndpoints: string[] = []

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          )
          totalSent++
        } catch (err: unknown) {
          totalFailed++
          // HTTP 410 Gone = subscription expirou, remover do banco
          if (
            typeof err === "object" &&
            err !== null &&
            "statusCode" in err &&
            (err as { statusCode: number }).statusCode === 410
          ) {
            staleEndpoints.push(sub.endpoint)
          }
        }
      })
    )

    // Limpa subscriptions expiradas
    for (const endpoint of staleEndpoints) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
    }

    // Salva no histórico
    await db.insert(pushNotifications).values({
      id: nanoid(),
      title: title.trim(),
      body: body.trim(),
      url: url ?? "/dashboard",
      type: type ?? "info",
      sentBy: session.user.name ?? session.user.email ?? "admin",
      totalSent,
      totalFailed,
    })

    return NextResponse.json({ ok: true, totalSent, totalFailed })
  } catch (err) {
    console.error("[admin/push/send]", err)
    return NextResponse.json({ error: "Erro ao enviar notificações" }, { status: 500 })
  }
}

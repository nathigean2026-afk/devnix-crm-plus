import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { pushSubscriptions, pushNotifications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import webpush from "web-push"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
  const jar = await cookies()
  const adminSession = jar.get("admin_session")?.value
  if (adminSession !== "admin-nathigean-001") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "Chaves VAPID não configuradas. Adicione NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY nas variáveis de ambiente." }, { status: 500 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? "mailto:suporte@elevanthe.com.br",
    vapidPublic,
    vapidPrivate
  )

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
      sentBy: "admin",
      totalSent,
      totalFailed,
    })

    return NextResponse.json({ ok: true, totalSent, totalFailed })
  } catch (err) {
    console.error("[admin/push/send]", err)
    return NextResponse.json({ error: "Erro ao enviar notificações" }, { status: 500 })
  }
}

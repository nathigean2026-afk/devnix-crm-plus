import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { pushSubscriptions, pushNotifications } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  const jar = await cookies()
  const adminSession = jar.get("admin_session")?.value
  if (adminSession !== "admin-nathigean-001") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const [subs, notifications] = await Promise.all([
      db.select().from(pushSubscriptions),
      db
        .select()
        .from(pushNotifications)
        .orderBy(desc(pushNotifications.createdAt))
        .limit(20),
    ])

    return NextResponse.json({
      totalSubscribers: subs.length,
      notifications,
    })
  } catch (err) {
    console.error("[admin/push/stats]", err)
    return NextResponse.json({ error: "Erro ao buscar stats" }, { status: 500 })
  }
}

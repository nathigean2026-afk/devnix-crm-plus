import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { chatbotSessions, chatbotMessages } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { verifyAdminSession } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const sessions = await db
    .select()
    .from(chatbotSessions)
    .orderBy(desc(chatbotSessions.updatedAt))
    .limit(100)

  return NextResponse.json({ sessions })
}

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { supportMessages, supportTickets } from "@/lib/db/schema"
import { and, eq, gt } from "drizzle-orm"

async function checkAdmin() {
  const jar = await cookies()
  return jar.get("admin_session")?.value === "authenticated"
}

export async function GET(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ticketId = searchParams.get("ticketId")
  const after = searchParams.get("after")

  if (!ticketId) return NextResponse.json({ error: "ticketId obrigatório" }, { status: 400 })

  const [ticket] = await db
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1)

  if (!ticket) return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 })

  const msgs = after
    ? await db
        .select()
        .from(supportMessages)
        .where(and(eq(supportMessages.ticketId, ticketId), gt(supportMessages.createdAt, new Date(after))))
        .orderBy(supportMessages.createdAt)
    : await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.ticketId, ticketId))
        .orderBy(supportMessages.createdAt)

  return NextResponse.json(msgs)
}

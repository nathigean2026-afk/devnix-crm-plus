import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { supportMessages, supportTickets } from "@/lib/db/schema"
import { and, eq, gt } from "drizzle-orm"

// Long-poll: busca mensagens novas para um ticket após um timestamp
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ticketId = searchParams.get("ticketId")
  const after = searchParams.get("after") // ISO timestamp

  if (!ticketId) return NextResponse.json({ error: "ticketId obrigatório" }, { status: 400 })

  // Verifica que o ticket pertence ao usuário
  const [ticket] = await db
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, session.user.id)))
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

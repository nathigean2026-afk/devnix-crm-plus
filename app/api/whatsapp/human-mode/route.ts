import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { chatbotSessions, chatbotMessages } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { verifyAdminSession } from "@/lib/admin-auth"
import { sendWhatsApp } from "@/lib/whatsapp"
import { nanoid } from "nanoid"

// PATCH — alterna humanMode de uma sessao
export async function PATCH(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const { sessionId, humanMode } = await req.json()

  await db
    .update(chatbotSessions)
    .set({ humanMode, updatedAt: new Date() })
    .where(eq(chatbotSessions.id, sessionId))

  return NextResponse.json({ ok: true })
}

// GET — busca mensagens de uma sessao especifica
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("sessionId")
  if (!sessionId) return NextResponse.json({ error: "sessionId obrigatorio" }, { status: 400 })

  const messages = await db
    .select()
    .from(chatbotMessages)
    .where(eq(chatbotMessages.sessionId, sessionId))
    .orderBy(desc(chatbotMessages.createdAt))
    .limit(50)

  return NextResponse.json({ messages: messages.reverse() })
}

// POST — admin envia mensagem manual para o contato
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const { sessionId, text } = await req.json()
  if (!sessionId || !text) return NextResponse.json({ error: "Campos obrigatorios" }, { status: 400 })

  const session = await db
    .select()
    .from(chatbotSessions)
    .where(eq(chatbotSessions.id, sessionId))
    .limit(1)
    .then(r => r[0])

  if (!session) return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 })

  await sendWhatsApp(session.phone, text)

  await db.insert(chatbotMessages).values({
    id: nanoid(),
    sessionId,
    direction: "out",
    text,
  })

  await db
    .update(chatbotSessions)
    .set({ lastReply: text, updatedAt: new Date() })
    .where(eq(chatbotSessions.id, sessionId))

  return NextResponse.json({ ok: true })
}

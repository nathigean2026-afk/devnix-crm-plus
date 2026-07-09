import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { chatbotMessages } from "@/lib/db/schema"
import { nanoid } from "nanoid"

// Endpoint de diagnostico — captura payload bruto da Wame e salva no banco
export async function GET() {
  // Le os ultimos 5 payloads capturados
  const rows = await db
    .select()
    .from(chatbotMessages)
    .limit(10)
    .then(r => r.filter(m => m.sessionId === "PING_DEBUG"))

  return NextResponse.json({
    ok: true,
    message: "Webhook Elevanthe CRM ativo",
    ts: new Date().toISOString(),
    payloads_capturados: rows.map(r => ({ ts: r.createdAt, payload: r.text })),
  })
}

export async function POST(req: NextRequest) {
  // Tenta ler como JSON, se falhar le como texto puro
  let body: unknown = null
  const raw = await req.text().catch(() => "")
  try { body = JSON.parse(raw) } catch { body = raw }

  // Salva no banco para consulta via GET
  await db.insert(chatbotMessages).values({
    id: nanoid(),
    sessionId: "PING_DEBUG",
    direction: "in",
    text: JSON.stringify({ ts: new Date().toISOString(), body }),
  }).catch(() => null)

  return NextResponse.json({ ok: true })
}

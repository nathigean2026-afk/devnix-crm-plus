import { NextRequest, NextResponse } from "next/server"

// Endpoint de diagnostico — confirma que o webhook esta ativo
// e ecoa o payload recebido para identificar o formato da Wame
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Webhook Elevanthe CRM ativo",
    ts: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  console.log("[v0] PING payload:", JSON.stringify(body, null, 2))
  return NextResponse.json({ ok: true, received: body })
}

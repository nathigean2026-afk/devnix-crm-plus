import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// Rota de administração para configurar e testar a chave Wame
// GET /api/admin/wame-config — retorna status atual
// POST /api/admin/wame-config — salva nova chave e testa

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const key = process.env.WAME_API_KEY ?? ""
  const server = process.env.WAME_SERVER ?? "https://us.api-wa.me"

  let testResult: { ok: boolean; status?: number; body?: string } = { ok: false }

  if (key) {
    try {
      const res = await fetch(`${server}/${key}/instance`, { method: "GET" })
      const body = await res.text()
      testResult = { ok: res.ok, status: res.status, body: body.slice(0, 200) }
    } catch (e) {
      testResult = { ok: false, body: String(e) }
    }
  }

  return NextResponse.json({
    keyLength: key.length,
    keyPreview: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : "(vazio)",
    server,
    testResult,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { key, server } = await req.json()
  if (!key || key.trim() === "") {
    return NextResponse.json({ error: "Chave inválida" }, { status: 400 })
  }

  const wameServer = (server ?? "https://us.api-wa.me").trim()

  // Testa a chave antes de salvar
  let testResult: { ok: boolean; status?: number; body?: string } = { ok: false }
  try {
    const res = await fetch(`${wameServer}/${key.trim()}/instance`, { method: "GET" })
    const body = await res.text()
    testResult = { ok: res.ok, status: res.status, body: body.slice(0, 300) }
  } catch (e) {
    testResult = { ok: false, body: String(e) }
  }

  return NextResponse.json({
    tested: true,
    key: key.trim(),
    server: wameServer,
    testResult,
    instruction: testResult.ok
      ? "Chave válida! Adicione WAME_API_KEY nas Vars do projeto (Settings > Vars) com este valor."
      : `Chave inválida ou instância não encontrada. Resposta: ${testResult.body}`,
  })
}

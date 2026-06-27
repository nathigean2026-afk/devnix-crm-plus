import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * POST /api/auth/set-latest-session
 *
 * Chamado pelo frontend após login bem-sucedido.
 * Grava dois cookies:
 *  - ea-latest-sid: ID da sessão mais recente para este usuário (compartilhado)
 *  - ea-current-sid: ID da sessão desta aba/dispositivo
 *
 * O middleware compara os dois — se diferirem, o usuário foi "kickado".
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user || !session.session) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const sessionId = session.session.id
  const isSecure = req.nextUrl.protocol === "https:"
  const cookiePrefix = isSecure ? "__Secure-" : ""

  const res = NextResponse.json({ ok: true })

  // ea-latest-sid: gravado a cada novo login — representa "a sessão mais recente"
  res.cookies.set(`${cookiePrefix}ea-latest-sid`, sessionId, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  })

  // ea-current-sid: representa "a sessão desta aba/dispositivo"
  res.cookies.set(`${cookiePrefix}ea-current-sid`, sessionId, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  })

  return res
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { session } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"

/**
 * GET /api/auth/session-check
 *
 * Verifica se o token de sessão enviado é o mais recente para o usuário.
 * Retorna 200 se válido, 401 se foi substituído por uma sessão mais nova.
 * Usado pelo middleware para garantir sessão única por usuário.
 */
export async function GET(req: NextRequest) {
  const sessionToken = req.headers.get("x-session-token")
  if (!sessionToken) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    // Busca a sessão atual pelo token
    const [currentSession] = await db
      .select({ id: session.id, userId: session.userId, createdAt: session.createdAt })
      .from(session)
      .where(eq(session.token, sessionToken))
      .limit(1)

    if (!currentSession) {
      // Token inválido ou expirado
      return NextResponse.json({ ok: false, reason: "not_found" }, { status: 401 })
    }

    // Busca a sessão mais recente do mesmo usuário
    const [latestSession] = await db
      .select({ id: session.id, createdAt: session.createdAt })
      .from(session)
      .where(eq(session.userId, currentSession.userId))
      .orderBy(desc(session.createdAt))
      .limit(1)

    if (!latestSession || latestSession.id !== currentSession.id) {
      // Existe uma sessão mais nova — esta foi "kickada"
      return NextResponse.json({ ok: false, reason: "superseded" }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[v0] session-check erro:", err)
    // Em caso de erro de banco, retorna 200 para não bloquear o usuário
    return NextResponse.json({ ok: true })
  }
}

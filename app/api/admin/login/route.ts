import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { scryptSync, timingSafeEqual } from "crypto"

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":")
    const hashBuffer = Buffer.from(hash, "hex")
    const derivedHash = scryptSync(password, salt, 64)
    return timingSafeEqual(hashBuffer, derivedHash)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const result = await db.execute(
    sql`SELECT id, username, "passwordHash" FROM admin_users WHERE username = ${username} LIMIT 1`
  )
  const admin = result.rows[0] as { id: string; username: string; passwordHash: string } | undefined

  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 })
  }

  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) {
    return NextResponse.json({ error: "Configuração de servidor ausente." }, { status: 500 })
  }
  const isProd = process.env.NODE_ENV === "production"
  // NUNCA retornar o token no JSON — apenas setar via cookie httpOnly
  const res = NextResponse.json({ ok: true })
  res.cookies.set("admin_session", adminSecret, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete("admin_session")
  return res
}

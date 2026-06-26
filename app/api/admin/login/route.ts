import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { scryptSync, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

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

  const cookieStore = await cookies()
  cookieStore.set("admin_session", admin.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 horas
    path: "/",
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_session")
  return NextResponse.json({ ok: true })
}

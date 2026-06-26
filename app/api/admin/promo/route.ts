import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { adminCreatePromoCode, adminGetPromoCodes, adminDeletePromoCode } from "@/lib/actions"

async function checkAdminSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (!session?.value || session.value !== "admin-nathigean-001") {
    return false
  }
  return true
}

export async function GET() {
  if (!(await checkAdminSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const codes = await adminGetPromoCodes()
  return NextResponse.json(codes)
}

export async function POST(req: NextRequest) {
  if (!(await checkAdminSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const data = await req.json()
  await adminCreatePromoCode(data)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdminSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { id } = await req.json()
  await adminDeletePromoCode(id)
  return NextResponse.json({ ok: true })
}

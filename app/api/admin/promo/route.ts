import { NextRequest, NextResponse } from "next/server"
import { adminCreatePromoCode, adminGetPromoCodes, adminDeletePromoCode } from "@/lib/actions"
import { verifyAdminSession } from "@/lib/admin-auth"

async function checkAdminSession(req: NextRequest) {
  return verifyAdminSession(req)
}

export async function GET(req: NextRequest) {
  if (!(await checkAdminSession(req))) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const codes = await adminGetPromoCodes()
  return NextResponse.json(codes)
}

export async function POST(req: NextRequest) {
  if (!(await checkAdminSession(req))) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const data = await req.json()
  await adminCreatePromoCode(data)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdminSession(req))) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { id } = await req.json()
  await adminDeletePromoCode(id)
  return NextResponse.json({ ok: true })
}

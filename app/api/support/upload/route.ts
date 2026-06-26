import { put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

  const maxSize = 10 * 1024 * 1024 // 10 MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 10 MB." }, { status: 400 })
  }

  const blob = await put(`support/${session.user.id}/${Date.now()}-${file.name}`, file, {
    access: "public",
  })

  return NextResponse.json({ url: blob.url, name: file.name })
}

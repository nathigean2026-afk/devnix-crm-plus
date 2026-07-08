import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  adminGetPatchNotes,
  adminCreatePatchNote,
  adminUpdatePatchNote,
  adminDeletePatchNote,
} from "@/lib/actions"

const ADMIN_TOKEN = "admin-nathigean-001"

async function checkAdminSession(req?: NextRequest) {
  // 1. Cookie (login normal)
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (session?.value === ADMIN_TOKEN) return true
  // 2. Header x-admin-token (fallback iframe/preview)
  if (req) {
    const header = req.headers.get("x-admin-token")
    if (header === ADMIN_TOKEN) return true
  }
  return false
}

/** Mapeia os campos do tab (content) para o campo do banco (body) e vice-versa */
function toDb(data: Record<string, unknown>) {
  return {
    version: data.version as string,
    title: data.title as string,
    body: (data.content ?? data.body) as string,
    type: (data.type as string) ?? "feature",
    published: data.published !== false,
  }
}

function fromDb(note: Record<string, unknown>) {
  return {
    id: note.id,
    version: note.version,
    title: note.title,
    content: note.body,   // tab usa "content"
    type: note.type,
    publishedAt: note.createdAt instanceof Date
      ? note.createdAt.toISOString().split("T")[0]
      : String(note.createdAt ?? ""),
    published: note.published,
  }
}

export async function GET(req: NextRequest) {
  if (!(await checkAdminSession(req)))
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const notes = await adminGetPatchNotes()
  return NextResponse.json(notes.map(fromDb))
}

export async function POST(req: NextRequest) {
  if (!(await checkAdminSession(req)))
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const data = await req.json()
  await adminCreatePatchNote(toDb(data))
  const notes = await adminGetPatchNotes()
  return NextResponse.json(notes.map(fromDb))
}

export async function PUT(req: NextRequest) {
  if (!(await checkAdminSession(req)))
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const data = await req.json()
  const { id, ...rest } = data as { id: string; [k: string]: unknown }
  await adminUpdatePatchNote(id, toDb(rest))
  const notes = await adminGetPatchNotes()
  return NextResponse.json(notes.map(fromDb))
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdminSession(req)))
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
  await adminDeletePatchNote(id)
  const notes = await adminGetPatchNotes()
  return NextResponse.json(notes.map(fromDb))
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { clients, businessProfile } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { sendWhatsApp, msgParabensAniversario } from "@/lib/whatsapp"

/**
 * POST /api/whatsapp/parabens
 * Body: { clientId: string }
 * Envia mensagem de parabéns para um cliente aniversariante.
 * Requer sessão autenticada.
 */
export async function POST(req: NextRequest) {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const clientId: string = body?.clientId
  if (!clientId) {
    return NextResponse.json({ error: "clientId obrigatório" }, { status: 400 })
  }

  // Carrega o cliente (garante que pertence ao prestador logado)
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, session.user.id)))
    .limit(1)

  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
  }

  if (!client.phone) {
    return NextResponse.json({ error: "Cliente sem telefone cadastrado" }, { status: 400 })
  }

  // Carrega o perfil do prestador para o nome na mensagem
  const [profile] = await db
    .select({ name: businessProfile.name })
    .from(businessProfile)
    .where(eq(businessProfile.userId, session.user.id))
    .limit(1)

  const msg = msgParabensAniversario({
    clientName: client.name.split(" ")[0],
    providerName: profile?.name ?? "nossa equipe",
  })

  const ok = await sendWhatsApp(client.phone, msg)

  if (!ok) {
    return NextResponse.json({ error: "Falha ao enviar mensagem. Verifique o número cadastrado." }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sentTo: client.name })
}

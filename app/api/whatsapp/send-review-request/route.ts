import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { serviceOrders, clients, businessProfile } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { sendWhatsApp, msgPesquisaSatisfacao } from "@/lib/whatsapp"

/**
 * POST /api/whatsapp/send-review-request
 * Body: { serviceOrderId: string }
 * Envia pesquisa de satisfação ao cliente após OS concluída.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { serviceOrderId } = body ?? {}
  if (!serviceOrderId) return NextResponse.json({ error: "serviceOrderId obrigatório" }, { status: 400 })

  const [profile] = await db
    .select()
    .from(businessProfile)
    .where(eq(businessProfile.userId, session.user.id))
    .limit(1)

  const plan = (profile?.licensePlan ?? "starter").toLowerCase()
  const hasBusinessPlus = plan === "business" || plan === "enterprise"
  if (!hasBusinessPlus) {
    return NextResponse.json({ error: "Recurso disponível apenas nos planos Business e Enterprise.", reason: "plan" }, { status: 403 })
  }

  const [os] = await db
    .select()
    .from(serviceOrders)
    .where(and(eq(serviceOrders.id, serviceOrderId), eq(serviceOrders.userId, session.user.id)))
    .limit(1)

  if (!os) return NextResponse.json({ error: "OS não encontrada" }, { status: 404 })

  const [client] = await db
    .select({ name: clients.name, phone: clients.phone })
    .from(clients)
    .where(eq(clients.id, os.clientId))
    .limit(1)

  if (!client?.phone) return NextResponse.json({ error: "Cliente sem telefone cadastrado" }, { status: 400 })

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crm.elevanthe.com"
  const reviewLink = `${BASE_URL}/avaliacao/${serviceOrderId}`

  const msg = msgPesquisaSatisfacao({
    clientName: client.name.split(" ")[0],
    providerName: profile?.name ?? "Prestador",
    osTitle: os.title,
    osNumber: os.number,
    reviewLink,
  })

  const ok = await sendWhatsApp(client.phone, msg)
  if (!ok) return NextResponse.json({ error: "Falha ao enviar mensagem. Verifique a configuração do WhatsApp." }, { status: 500 })

  return NextResponse.json({ ok: true, sentTo: client.name, reviewLink })
}

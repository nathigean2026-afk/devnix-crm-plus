import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { quotes, businessProfile, user } from "@/lib/db/schema"
import { eq, and, gte } from "drizzle-orm"

// GET /api/notifications/quotes?since=ISO_TIMESTAMP
// Retorna orçamentos respondidos (aprovados ou recusados) após `since`.
// Disponível apenas para planos Business e Enterprise.
// Usado pelo hook useQuoteNotifications para polling a cada 20s.
export async function GET(req: NextRequest) {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  // Verifica se o usuário tem plano Business ou Enterprise
  // Funcionários herdam o plano do dono — verifica businessProfile do userId da sessão
  const [profile] = await db
    .select({ licensePlan: businessProfile.licensePlan, ownerId: businessProfile.userId })
    .from(businessProfile)
    .where(eq(businessProfile.userId, session.user.id))
    .limit(1)

  // Se não tem Business+ retorna lista vazia (sem erro, para não quebrar o hook)
  const plan = profile?.licensePlan ?? "starter"
  if (plan !== "business" && plan !== "enterprise") {
    return NextResponse.json({ quotes: [] })
  }

  const sinceParam = req.nextUrl.searchParams.get("since")
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 2 * 60 * 60 * 1000) // últimas 2h

  const responded = await db
    .select({
      id: quotes.id,
      number: quotes.number,
      title: quotes.title,
      status: quotes.status,
      respondedAt: quotes.respondedAt,
    })
    .from(quotes)
    .where(
      and(
        eq(quotes.userId, session.user.id),
        gte(quotes.respondedAt, since),
      )
    )

  return NextResponse.json({ quotes: responded })
}

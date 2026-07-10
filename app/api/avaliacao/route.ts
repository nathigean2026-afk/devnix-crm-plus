import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { serviceOrders, serviceReviews } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * POST /api/avaliacao
 * Público — chamado pelo cliente via página /avaliacao/[id].
 * Salva avaliação vinculada à OS.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { serviceOrderId, rating, comment } = body

    if (!serviceOrderId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const [os] = await db
      .select({ userId: serviceOrders.userId, clientId: serviceOrders.clientId })
      .from(serviceOrders)
      .where(eq(serviceOrders.id, serviceOrderId))
      .limit(1)

    if (!os) return NextResponse.json({ error: "OS não encontrada" }, { status: 404 })

    // Verifica se já existe avaliação (upsert: atualiza se já existe)
    const [existing] = await db
      .select({ id: serviceReviews.id })
      .from(serviceReviews)
      .where(eq(serviceReviews.serviceOrderId, serviceOrderId))
      .limit(1)

    if (existing) {
      await db
        .update(serviceReviews)
        .set({ rating, comment: comment?.trim() || null })
        .where(eq(serviceReviews.id, existing.id))
    } else {
      await db.insert(serviceReviews).values({
        id: crypto.randomUUID(),
        serviceOrderId,
        userId: os.userId,
        clientId: os.clientId,
        rating,
        comment: comment?.trim() || null,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

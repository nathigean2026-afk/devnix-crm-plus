import { db } from "@/lib/db"
import { serviceOrders, businessProfile, clients, serviceReviews } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import ReviewForm from "./review-form"

export const metadata = {
  title: "Avalie o serviço",
  description: "Compartilhe sua experiência e ajude-nos a melhorar.",
}

export default async function AvaliacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [os] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id)).limit(1)
  if (!os) return notFound()

  const [profile] = await db.select().from(businessProfile).where(eq(businessProfile.userId, os.userId)).limit(1)
  const [client] = await db.select({ name: clients.name }).from(clients).where(eq(clients.id, os.clientId)).limit(1)

  // Verifica se já foi avaliado
  const [existing] = await db.select().from(serviceReviews).where(eq(serviceReviews.serviceOrderId, id)).limit(1)

  return (
    <ReviewForm
      serviceOrderId={id}
      osTitle={os.title}
      osNumber={os.number}
      providerName={profile?.name ?? "Prestador"}
      providerLogo={profile?.logoUrl ?? null}
      clientName={client?.name ?? "Cliente"}
      alreadyReviewed={!!existing}
      existingRating={existing?.rating}
      existingComment={existing?.comment ?? undefined}
    />
  )
}

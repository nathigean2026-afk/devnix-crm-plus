"use server"

import { stripe } from "@/lib/stripe"
import { getPlanById } from "@/lib/products"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function startCheckoutSession(planId: string): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Nao autenticado")

  const plan = getPlanById(planId)
  if (!plan) throw new Error(`Plano "${planId}" nao encontrado`)

  const origin =
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"

  const checkoutSession = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    payment_method_types: ["card"],
    currency: "brl",
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    // Metadados usados pelo webhook para ativar a licenca
    metadata: {
      userId: session.user.id,
      planId: plan.id,
      durationDays: String(plan.durationDays),
    },
  })

  if (!checkoutSession.client_secret) {
    throw new Error("Falha ao criar sessao de checkout")
  }

  return checkoutSession.client_secret
}

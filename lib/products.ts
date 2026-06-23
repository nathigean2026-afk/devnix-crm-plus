export type PlanId = "7d" | "30d" | "1y"

export interface LicensePlan {
  id: PlanId
  name: string
  description: string
  priceInCents: number // centavos BRL
  durationDays: number
}

// Fonte de verdade dos planos — precos definidos somente no servidor
export const LICENSE_PLANS: LicensePlan[] = [
  {
    id: "7d",
    name: "Devnix CRM Plus — Start",
    description: "Acesso completo por 7 dias",
    priceInCents: 700, // R$ 7,00
    durationDays: 7,
  },
  {
    id: "30d",
    name: "Devnix CRM Plus — Business",
    description: "Acesso completo por 30 dias",
    priceInCents: 2400, // R$ 24,00
    durationDays: 30,
  },
  {
    id: "1y",
    name: "Devnix CRM Plus — Enterprise",
    description: "Acesso completo por 12 meses",
    priceInCents: 26000, // R$ 260,00
    durationDays: 365,
  },
]

export function getPlanById(id: string): LicensePlan | undefined {
  return LICENSE_PLANS.find((p) => p.id === id)
}

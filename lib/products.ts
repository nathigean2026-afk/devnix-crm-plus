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
    name: "Elevanthe CRM — Start",
    description: "Acesso completo por 7 dias",
    priceInCents: 700, // R$ 7,00
    durationDays: 7,
  },
  {
    id: "30d",
    name: "Elevanthe CRM — Business",
    description: "Acesso completo por 30 dias",
    priceInCents: 3000, // R$ 30,00
    durationDays: 30,
  },
  {
    id: "1y",
    name: "Elevanthe CRM — Enterprise",
    description: "Acesso completo por 360 dias",
    priceInCents: 28000, // R$ 280,00
    durationDays: 360,
  },
]

export function getPlanById(id: string): LicensePlan | undefined {
  return LICENSE_PLANS.find((p) => p.id === id)
}

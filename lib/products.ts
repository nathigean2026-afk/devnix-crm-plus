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
    name: "Devnix CRM Plus — Teste (7 dias)",
    description: "Acesso completo por 7 dias",
    priceInCents: 1990, // R$ 19,90
    durationDays: 7,
  },
  {
    id: "30d",
    name: "Devnix CRM Plus — Mensal",
    description: "Acesso completo por 30 dias",
    priceInCents: 4990, // R$ 49,90
    durationDays: 30,
  },
  {
    id: "1y",
    name: "Devnix CRM Plus — Anual",
    description: "Acesso completo por 12 meses",
    priceInCents: 39990, // R$ 399,90
    durationDays: 365,
  },
]

export function getPlanById(id: string): LicensePlan | undefined {
  return LICENSE_PLANS.find((p) => p.id === id)
}

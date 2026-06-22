"use client"

import { useState, useTransition } from "react"
import { activateLicense } from "@/lib/actions"
import { toast } from "sonner"
import Image from "next/image"
import { Check, Zap, CalendarDays, CalendarRange, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface PlanosViewProps {
  user: { name: string; email: string }
  isRenovar?: boolean
}

const plans = [
  {
    id: "7d" as const,
    label: "Teste",
    duration: "7 dias",
    price: "R$ 19,90",
    period: "por 7 dias",
    description: "Ideal para conhecer a plataforma sem compromisso.",
    icon: Zap,
    features: [
      "Acesso completo por 7 dias",
      "Clientes ilimitados",
      "Ordens de servico ilimitadas",
      "Orcamentos e financeiro",
      "Suporte por email",
    ],
    highlight: false,
    badge: null,
  },
  {
    id: "30d" as const,
    label: "Mensal",
    duration: "30 dias",
    price: "R$ 49,90",
    period: "por mes",
    description: "Para profissionais que precisam de controle mensal.",
    icon: CalendarDays,
    features: [
      "Acesso completo por 30 dias",
      "Clientes ilimitados",
      "Ordens de servico ilimitadas",
      "Orcamentos e financeiro",
      "Relatorios completos",
      "Suporte prioritario",
    ],
    highlight: true,
    badge: "Mais popular",
  },
  {
    id: "1y" as const,
    label: "Anual",
    duration: "1 ano",
    price: "R$ 399,90",
    period: "por ano",
    description: "Melhor custo-beneficio para uso continuo.",
    icon: CalendarRange,
    features: [
      "Acesso completo por 12 meses",
      "Clientes ilimitados",
      "Ordens de servico ilimitadas",
      "Orcamentos e financeiro",
      "Relatorios completos",
      "Suporte VIP",
      "Economia de R$ 198,90",
    ],
    highlight: false,
    badge: "Melhor valor",
  },
]

export function PlanosView({ user, isRenovar = false }: PlanosViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedPlan, setSelectedPlan] = useState<"7d" | "30d" | "1y" | null>(null)

  function handleActivate(planId: "7d" | "30d" | "1y") {
    setSelectedPlan(planId)
    startTransition(async () => {
      try {
        await activateLicense(planId)
      } catch {
        toast.error("Erro ao ativar licenca. Tente novamente.")
        setSelectedPlan(null)
      }
    })
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20reduzida-B2qAbWz2qQ52LWM7e7hYbiRRWNXHqD.png"
            alt="Devnix"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="font-semibold text-foreground text-sm hidden sm:block">Devnix CRM Plus</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-none">{user.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-10 md:py-16">
        {/* Hero */}
        <div className="text-center mb-10 md:mb-14 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <span className="size-1.5 rounded-full bg-primary" />
            Ative sua licenca para comecar
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance leading-tight">
            {isRenovar ? "Renovar sua licenca" : "Escolha o plano ideal para o seu negocio"}
          </h1>
          <p className="mt-3 text-muted-foreground text-base text-pretty">
            {isRenovar
              ? "Renove sua licenca para continuar usando todas as funcionalidades."
              : "Acesso completo a todas as funcionalidades. Cancele quando quiser."}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isLoading = isPending && selectedPlan === plan.id
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6 transition-all",
                  plan.highlight
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card"
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                    plan.highlight
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-border"
                  )}>
                    {plan.badge}
                  </div>
                )}

                {/* Icon + Label */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={cn(
                    "size-9 rounded-lg flex items-center justify-center",
                    plan.highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="size-4.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{plan.label}</p>
                    <p className="text-xs text-muted-foreground">{plan.duration}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className={cn(
                      "text-3xl font-bold",
                      plan.highlight ? "text-primary" : "text-foreground"
                    )}>
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.period}</p>
                </div>

                <p className="text-sm text-muted-foreground mb-5 text-pretty">{plan.description}</p>

                {/* Features */}
                <ul className="flex flex-col gap-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className={cn(
                        "size-4 shrink-0 mt-0.5",
                        plan.highlight ? "text-primary" : "text-muted-foreground"
                      )} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleActivate(plan.id)}
                  disabled={isPending}
                  className={cn(
                    "w-full py-2.5 rounded-lg text-sm font-semibold transition-all",
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      : "bg-muted text-foreground hover:bg-muted/80 border border-border disabled:opacity-60"
                  )}
                >
                  {isLoading ? "Ativando..." : `Ativar por ${plan.price}`}
                </button>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-xs text-muted-foreground text-center max-w-sm text-pretty">
          Ao ativar um plano, voce concorda com os termos de uso. Os valores sao cobrados no ato da ativacao.
        </p>
      </main>
    </div>
  )
}

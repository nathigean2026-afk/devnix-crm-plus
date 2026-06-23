"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, Zap, CalendarDays, CalendarRange, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { CheckoutModal } from "./checkout-modal"
import { PixCheckoutModal } from "./pix-checkout-modal"

interface PlanosViewProps {
  user: { name: string; email: string }
  isRenovar?: boolean
}

const plans = [
  {
    id: "7d" as const,
    label: "Start",
    duration: "7 dias",
    price: "R$ 7,00",
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
    label: "Business",
    duration: "30 dias",
    price: "R$ 24,00",
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
    label: "Enterprise",
    duration: "1 ano",
    price: "R$ 260,00",
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
      "Economia de R$ 28,00 vs mensal",
    ],
    highlight: false,
    badge: "Melhor valor",
  },
]

export function PlanosView({ user, isRenovar = false }: PlanosViewProps) {
  const router = useRouter()
  const [checkoutPlan, setCheckoutPlan] = useState<{ id: string; name: string } | null>(null)
  const [pixPlan, setPixPlan] = useState<{ id: string; name: string; price: string } | null>(null)

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
            {isRenovar ? "Renovacao de licenca" : "Ative sua licenca para comecar"}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance leading-tight">
            {isRenovar ? "Renovar sua licenca" : "Escolha o plano ideal para o seu negocio"}
          </h1>
          <p className="mt-3 text-muted-foreground text-base text-pretty">
            {isRenovar
              ? "Renove sua licenca para continuar usando todas as funcionalidades."
              : "Acesso completo a todas as funcionalidades. Cancele quando quiser."}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-green-500" />
              Cartao de credito
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-green-500" />
              Pix
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-blue-500" />
              Pagamento seguro
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {plans.map((plan) => {
            const Icon = plan.icon
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
                    <Icon className="size-4" />
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

                {/* CTA — dois metodos de pagamento */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setCheckoutPlan({ id: plan.id, name: `Plano ${plan.label} — ${plan.price}` })}
                    className={cn(
                      "w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                      plan.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                    )}
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Cartao — {plan.price}
                  </button>
                  <button
                    onClick={() => setPixPlan({ id: plan.id, name: `Plano ${plan.label}`, price: plan.price })}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20"
                  >
                    <svg className="size-4" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M242.4 292.5C247.8 287.1 255.1 284.3 262.5 284.3C269.8 284.3 277.2 287.1 282.6 292.5L371.1 381C377.6 387.5 377.6 397.9 371.1 404.4L282.6 492.9C277.2 498.3 269.8 501.1 262.5 501.1C255.1 501.1 247.8 498.3 242.4 492.9L153.9 404.4C147.4 397.9 147.4 387.5 153.9 381L242.4 292.5zM242.4 19.03C247.8 13.63 255.1 10.82 262.5 10.82C269.8 10.82 277.2 13.63 282.6 19.03L371.1 107.5C377.6 114 377.6 124.4 371.1 130.9L282.6 219.4C277.2 224.8 269.8 227.6 262.5 227.6C255.1 227.6 247.8 224.8 242.4 219.4L153.9 130.9C147.4 124.4 147.4 114 153.9 107.5L242.4 19.03zM19.03 129.4C24.43 124 31.8 121.2 39.13 121.2C46.46 121.2 53.8 124 59.2 129.4L147.7 217.9C154.2 224.4 154.2 234.8 147.7 241.3L59.2 329.8C53.8 335.2 46.46 337.1 39.13 337.1C31.8 337.1 24.43 335.2 19.03 329.8L-69.47 241.3C-75.97 234.8 -75.97 224.4 -69.47 217.9L19.03 129.4zM465.9 129.4C471.3 124 478.7 121.2 486 121.2C493.3 121.2 500.7 124 506.1 129.4L594.6 217.9C601.1 224.4 601.1 234.8 594.6 241.3L506.1 329.8C500.7 335.2 493.3 337.1 486 337.1C478.7 337.1 471.3 335.2 465.9 329.8L377.4 241.3C370.9 234.8 370.9 224.4 377.4 217.9L465.9 129.4z" />
                    </svg>
                    Pix — {plan.price}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <svg className="size-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Cartao via Stripe
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3.5 rounded-sm bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-[8px] font-bold">P</span>
              </div>
              Pix via Mercado Pago
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-sm text-pretty">
            Pagamento 100% seguro. Licenca ativada automaticamente apos confirmacao.
          </p>
        </div>
      </main>

      {/* Modal Stripe — Cartao */}
      {checkoutPlan && (
        <CheckoutModal
          planId={checkoutPlan.id}
          planName={checkoutPlan.name}
          onClose={() => setCheckoutPlan(null)}
        />
      )}

      {/* Modal Mercado Pago — Pix */}
      {pixPlan && (
        <PixCheckoutModal
          open={!!pixPlan}
          onClose={() => setPixPlan(null)}
          planId={pixPlan.id}
          planName={pixPlan.name}
          planPrice={pixPlan.price}
        />
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Check, Zap, CalendarDays, CalendarRange,
  LogOut, Loader2, ShieldCheck, ArrowRight, Sparkles,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"

interface PlanosViewProps {
  user: { name: string; email: string }
  isRenovar?: boolean
}

const plans = [
  {
    id: "7d" as const,
    label: "Start",
    duration: "7 dias",
    priceInt: "7",
    priceDec: "00",
    period: "acesso por 7 dias",
    description: "Conhea a plataforma completa sem compromisso.",
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
    priceInt: "24",
    priceDec: "00",
    period: "por mes",
    description: "Controle total do seu negocio com renovacao mensal.",
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
    priceInt: "260",
    priceDec: "00",
    period: "por ano · R$ 21,67/mes",
    description: "Melhor custo-beneficio. Economia de R$ 28 vs mensal.",
    icon: CalendarRange,
    features: [
      "Acesso completo por 12 meses",
      "Clientes ilimitados",
      "Ordens de servico ilimitadas",
      "Orcamentos e financeiro",
      "Relatorios completos",
      "Suporte VIP",
      "Economia de R$ 28 vs mensal",
    ],
    highlight: false,
    badge: "Melhor valor",
  },
]

function MpLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#009EE3" />
      <path d="M4 12.25L7.6 8.5l2.9 2.9 2.9-2.9 3.6 3.75-3.6 3.6-2.9-3.05-2.9 3.05L4 12.25Z" fill="white" />
    </svg>
  )
}

export function PlanosView({ user, isRenovar = false }: PlanosViewProps) {
  const router = useRouter()
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  async function handleCheckout(planId: string) {
    setLoadingPlanId(planId)
    try {
      const res = await fetch("/api/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro ao iniciar checkout")
      if (!data.initPoint) throw new Error("URL de checkout nao recebida")
      window.location.href = data.initPoint
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao abrir checkout")
      setLoadingPlanId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20reduzida-B2qAbWz2qQ52LWM7e7hYbiRRWNXHqD.png"
              alt="Devnix"
              width={26}
              height={26}
              className="object-contain"
            />
            <span className="font-semibold text-sm text-foreground">Devnix CRM Plus</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <div className="hidden sm:block h-4 w-px bg-border mx-1" />
            <span className="hidden sm:block text-xs text-muted-foreground max-w-[160px] truncate">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-muted"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16 md:py-24">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full border border-border bg-muted/40 text-muted-foreground mb-6 tracking-wide uppercase">
            <Sparkles className="size-3 text-primary" />
            {isRenovar ? "Renovacao de licenca" : "Planos e Precos"}
          </div>
          <h1 className="text-4xl md:text-[52px] font-black tracking-tight text-foreground text-balance leading-[1.06] mb-5">
            {isRenovar
              ? "Renove seu acesso"
              : "Escolha seu plano"}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-[420px] mx-auto text-pretty leading-relaxed">
            Acesso completo a todos os modulos do CRM.
            Pagamento unico, sem assinatura automatica.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: "pix", label: "Pix" },
              { icon: "card", label: "Cartao de credito" },
              { icon: "boleto", label: "Boleto bancario" },
            ].map((m) => (
              <span key={m.label} className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-border bg-muted/30 text-muted-foreground">
                {m.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#009EE3]/40 bg-[#009EE3]/8 text-[#009EE3]">
              <MpLogo className="size-3.5" />
              Mercado Pago
            </span>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isLoading = loadingPlanId === plan.id
            const isAnyLoading = !!loadingPlanId

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6 transition-all duration-200",
                  plan.highlight
                    ? "border-primary/50 bg-primary/[0.03] ring-1 ring-primary/20 shadow-xl shadow-primary/10"
                    : "border-border/80 bg-card"
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide border",
                    plan.highlight
                      ? "bg-primary text-primary-foreground border-primary/80"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  )}>
                    {plan.badge}
                  </div>
                )}

                {/* Header do card */}
                <div className="mb-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={cn(
                      "size-9 rounded-lg flex items-center justify-center",
                      plan.highlight ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground leading-none">{plan.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.duration}</p>
                    </div>
                  </div>

                  {/* Preco */}
                  <div className="flex items-start gap-0.5 mb-1.5">
                    <span className="text-sm font-semibold text-muted-foreground mt-2.5 mr-0.5">R$</span>
                    <span className={cn(
                      "text-5xl font-black tracking-tighter leading-none",
                      plan.highlight ? "text-primary" : "text-foreground"
                    )}>
                      {plan.priceInt}
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground mt-2.5">,{plan.priceDec}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.period}</p>
                </div>

                {/* Separador */}
                <div className="h-px bg-border/60 mb-5" />

                {/* Descricao */}
                <p className="text-sm text-muted-foreground mb-5 text-pretty leading-relaxed">
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="flex flex-col gap-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <div className={cn(
                        "size-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        plan.highlight ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Check className="size-2.5" strokeWidth={3} />
                      </div>
                      <span className="text-foreground/80 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isAnyLoading}
                  className={cn(
                    "w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150",
                    "flex items-center justify-center gap-2",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.99]"
                      : "bg-foreground text-background hover:opacity-85 active:scale-[0.99]"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Abrindo...</span>
                    </>
                  ) : (
                    <>
                      <MpLogo className="size-4" />
                      <span>Pagar com Mercado Pago</span>
                      <ArrowRight className="size-3.5 ml-auto opacity-60" />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* FAQ rapido / garantias */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/60 pt-12">
          {[
            {
              title: "Sem cobranca automatica",
              desc: "Nao ha assinatura recorrente. Voce paga apenas quando quiser renovar.",
            },
            {
              title: "Ativacao imediata",
              desc: "Apos confirmacao do pagamento, sua licenca e ativada automaticamente.",
            },
            {
              title: "Pagamento seguro",
              desc: "Checkout processado pelo Mercado Pago — PIX, cartao e boleto.",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

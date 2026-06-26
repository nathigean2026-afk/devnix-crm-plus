"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Check, Zap, CalendarDays, CalendarRange,
  LogOut, Loader2, ShieldCheck, ArrowRight,
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
    color: "text-zinc-400",
  },
  {
    id: "30d" as const,
    label: "Business",
    duration: "30 dias",
    priceInt: "24",
    priceDec: "00",
    period: "por mes",
    description: "Para profissionais que precisam de controle total mensal.",
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
    color: "text-primary",
  },
  {
    id: "1y" as const,
    label: "Enterprise",
    duration: "1 ano",
    priceInt: "260",
    priceDec: "00",
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
      "Economia de R$ 28 vs mensal",
    ],
    highlight: false,
    badge: "Melhor valor",
    color: "text-amber-500",
  },
]

function MpLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#009EE3"/>
      <path d="M5 14.3L9.2 10l3.3 3.3 3.3-3.3 4.2 4.3-4.2 4.2L12.5 15l-3.3 3.5L5 14.3Z" fill="white"/>
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
      const url = data.initPoint
      if (!url) throw new Error("URL de checkout nao recebida")
      window.location.href = url
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao abrir checkout")
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20reduzida-B2qAbWz2qQ52LWM7e7hYbiRRWNXHqD.png"
              alt="Devnix"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="font-semibold text-foreground text-sm">Devnix CRM Plus</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border ml-1">
              <div className="text-right">
                <p className="text-xs font-medium text-foreground leading-none">{user.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[140px]">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted ml-1"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-14 md:py-20">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground mb-5">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {isRenovar ? "Renovacao de licenca" : "Ative sua licenca"}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground text-balance leading-[1.05] mb-4">
            {isRenovar
              ? "Renovar sua licenca"
              : "Escolha o plano certo para seu negocio"}
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto text-pretty leading-relaxed">
            {isRenovar
              ? "Continue com acesso completo a todas as funcionalidades do CRM."
              : "Acesso completo a todos os modulos. Cancele a qualquer momento."}
          </p>
          {/* Metodos aceitos */}
          <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
            {["Pix", "Cartao de credito", "Boleto bancario"].map((m) => (
              <span key={m} className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-muted/30 text-muted-foreground font-medium">
                {m}
              </span>
            ))}
            <span className="text-[11px] px-2.5 py-1 rounded-md border border-[#009EE3]/30 bg-[#009EE3]/5 text-[#009EE3] font-medium flex items-center gap-1.5">
              <MpLogo className="size-3" />
              Mercado Pago
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isLoading = loadingPlanId === plan.id

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6 transition-all duration-200",
                  plan.highlight
                    ? "border-primary/40 bg-primary/[0.03] ring-1 ring-primary/20 shadow-lg shadow-primary/5"
                    : "border-border bg-card hover:border-border/80"
                )}
              >
                {plan.badge && (
                  <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap border",
                    plan.highlight
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border"
                  )}>
                    {plan.badge}
                  </div>
                )}

                {/* Icon + label */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center border",
                    plan.highlight
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-muted border-border text-muted-foreground"
                  )}>
                    <Icon className="size-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-none">{plan.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{plan.duration}</p>
                  </div>
                </div>

                {/* Preco */}
                <div className="mb-1">
                  <div className="flex items-start gap-1 leading-none">
                    <span className="text-sm text-muted-foreground mt-1.5 font-medium">R$</span>
                    <span className={cn(
                      "text-[42px] font-black tracking-tight leading-none",
                      plan.highlight ? "text-primary" : "text-foreground"
                    )}>
                      {plan.priceInt}
                    </span>
                    <span className="text-sm text-muted-foreground mt-2 font-medium">,{plan.priceDec}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{plan.period}</p>
                </div>

                <p className="text-sm text-muted-foreground mb-5 mt-3 text-pretty leading-relaxed">
                  {plan.description}
                </p>

                {/* Divisor */}
                <div className="w-full h-px bg-border mb-5" />

                {/* Features */}
                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className={cn(
                        "size-4 shrink-0 mt-0.5",
                        plan.highlight ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={!!loadingPlanId}
                  className={cn(
                    "w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                      : "bg-foreground text-background hover:opacity-90"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MpLogo className="size-4" />
                  )}
                  {isLoading ? "Abrindo checkout..." : "Pagar com Mercado Pago"}
                  {!isLoading && <ArrowRight className="size-3.5 ml-auto" />}
                </button>
              </div>
            )
          })}
        </div>

        {/* Rodape seguranca */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-500" />
            Pagamento 100% seguro processado pelo Mercado Pago
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            Pix, cartao de credito e boleto. Licenca ativada automaticamente apos confirmacao.
          </p>
        </div>
      </main>
    </div>
  )
}

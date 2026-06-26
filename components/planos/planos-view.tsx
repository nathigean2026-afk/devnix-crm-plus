"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Check, Zap, CalendarDays, CalendarRange,
  LogOut, Loader2, ShieldCheck, Lock, Sparkles,
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
    price: 7,
    period: "acesso por 7 dias",
    description: "Conheça a plataforma completa sem compromisso. Ideal para avaliar antes de assinar.",
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
    savings: null,
  },
  {
    id: "30d" as const,
    label: "Business",
    duration: "30 dias",
    price: 24,
    period: "por mes",
    description: "Para profissionais que precisam de controle total do negocio com renovacao mensal.",
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
    savings: null,
  },
  {
    id: "1y" as const,
    label: "Enterprise",
    duration: "1 ano",
    price: 260,
    period: "por ano",
    description: "Melhor custo-beneficio para uso continuo. Economia garantida versus o plano mensal.",
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
    savings: "R$ 28 de economia",
  },
]

// Isotipo oficial do Mercado Pago — círculo azul #009EE3 com o símbolo MP em branco
function MpLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mercado Pago"
      role="img"
    >
      <circle cx="16" cy="16" r="16" fill="#009EE3" />
      {/* Letra M estilizada — forma oficial do isotipo MP */}
      <path
        d="M7 22V13l4.5 5.5L16 13l4.5 5.5L25 13v9"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
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

  const isAnyLoading = !!loadingPlanId

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20reduzida-B2qAbWz2qQ52LWM7e7hYbiRRWNXHqD.png"
              alt="Devnix CRM Plus"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="font-semibold text-sm tracking-tight">Devnix CRM Plus</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden md:block text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</span>
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Hero */}
        <div className="pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase px-3 py-1 rounded-full border border-border bg-muted/30 text-muted-foreground mb-6">
            <Sparkles className="size-3 text-primary" />
            {isRenovar ? "Renovacao de licenca" : "Planos e precos"}
          </div>

          <h1 className="text-[42px] sm:text-[56px] font-black tracking-tighter leading-[1.04] text-foreground text-balance mb-5">
            {isRenovar
              ? <>Renove seu<br className="hidden sm:block" /> acesso</>
              : <>Escolha seu<br className="hidden sm:block" /> plano</>
            }
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed text-pretty mb-8">
            Acesso completo a todos os modulos.
            Pagamento unico, sem assinatura automatica.
          </p>

          {/* Metodos de pagamento aceitos */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["Pix", "Cartao de credito", "Boleto"].map((m) => (
              <span
                key={m}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-border bg-card text-muted-foreground"
              >
                {m}
              </span>
            ))}
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#009EE3]/30 bg-[#009EE3]/5 text-[#009EE3] flex items-center gap-1.5">
              <MpLogo className="size-3.5" />
              via Mercado Pago
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-20">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isLoading = loadingPlanId === plan.id

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border transition-shadow duration-200",
                  plan.highlight
                    ? "border-primary ring-2 ring-primary/20 bg-card shadow-2xl shadow-primary/10"
                    : "border-border bg-card hover:shadow-md"
                )}
              >
                {/* Badge flutuante */}
                {plan.badge && (
                  <div className={cn(
                    "absolute -top-3 left-6 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                    plan.highlight
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-amber-500 text-white border-amber-500"
                  )}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">

                  {/* Nome e icone */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{plan.label}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.duration}</p>
                    </div>
                    <div className={cn(
                      "size-9 rounded-lg flex items-center justify-center shrink-0",
                      plan.highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="size-4.5" />
                    </div>
                  </div>

                  {/* Preco */}
                  <div className="mb-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-medium text-muted-foreground">R$</span>
                      <span className={cn(
                        "text-[52px] font-black tracking-tighter leading-none",
                        plan.highlight ? "text-primary" : "text-foreground"
                      )}>
                        {plan.price}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">,00</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{plan.period}</p>
                    {plan.savings && (
                      <p className="text-xs font-semibold text-emerald-500 mt-1">{plan.savings}</p>
                    )}
                  </div>

                  {/* Separador */}
                  <div className="my-5 h-px bg-border" />

                  {/* Descricao */}
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty mb-5">
                    {plan.description}
                  </p>

                  {/* Features */}
                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <div className={cn(
                          "size-4 rounded-full flex items-center justify-center shrink-0",
                          plan.highlight
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}>
                          <Check className="size-2.5" strokeWidth={3} />
                        </div>
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Botao CTA */}
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={isAnyLoading}
                    className={cn(
                      "w-full h-11 rounded-xl text-sm font-semibold transition-all duration-150",
                      "flex items-center justify-center gap-2.5",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      plan.highlight
                        ? [
                          "bg-primary text-primary-foreground",
                          "hover:brightness-110 active:brightness-95",
                          "shadow-lg shadow-primary/30",
                        ]
                        : [
                          "bg-foreground text-background",
                          "hover:opacity-90 active:opacity-80",
                        ]
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Aguarde...</span>
                      </>
                    ) : (
                      <>
                        <MpLogo className="size-4" />
                        <span>Pagar com Mercado Pago</span>
                      </>
                    )}
                  </button>

                </div>
              </div>
            )
          })}
        </div>

        {/* Garantias */}
        <div className="border-t border-border/60 py-12 grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[
            {
              icon: ShieldCheck,
              title: "Sem cobranca automatica",
              desc: "Nenhuma assinatura recorrente. Voce renova apenas quando quiser.",
            },
            {
              icon: Sparkles,
              title: "Ativacao instantanea",
              desc: "Licenca ativada automaticamente apos confirmacao do pagamento.",
            },
            {
              icon: Lock,
              title: "Pagamento 100% seguro",
              desc: "Processado pelo Mercado Pago. Aceita Pix, cartao e boleto.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3.5">
              <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}

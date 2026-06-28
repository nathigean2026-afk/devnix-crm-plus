"use client"

import { Check, Zap, Crown, Rocket } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "R$ 49",
    period: "/mês",
    desc: "Ideal para começar",
    icon: Zap,
    color: "from-sky-500/20 to-blue-500/20",
    border: "border-sky-500/20",
    iconColor: "text-sky-400",
    highlight: false,
    features: [
      "1 usuário",
      "Até 100 clientes",
      "Orçamentos ilimitados",
      "Ordens de Serviço",
      "Pagamento via Pix",
      "Suporte por e-mail",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "R$ 99",
    period: "/mês",
    desc: "O mais popular",
    icon: Rocket,
    color: "from-primary/25 to-indigo-500/20",
    border: "border-primary/40",
    iconColor: "text-primary",
    highlight: true,
    features: [
      "Até 5 usuários",
      "Clientes ilimitados",
      "Relatórios avançados",
      "Controle de estoque",
      "Notificações WhatsApp",
      "Suporte prioritário",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "R$ 199",
    period: "/mês",
    desc: "Para grandes equipes",
    icon: Crown,
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
    highlight: false,
    features: [
      "Usuários ilimitados",
      "Multi-empresa",
      "API de integração",
      "Suporte VIP 24h",
      "Treinamento incluído",
      "Personalização completa",
    ],
  },
]

interface PricingCardsProps {
  isDark: boolean
}

export function PricingCards({ isDark }: PricingCardsProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-10">
      <div className="text-center mb-6">
        <p className={cn("text-xs font-semibold uppercase tracking-widest mb-1", isDark ? "text-primary/70" : "text-primary/80")}>
          Planos e Preços
        </p>
        <h2 className={cn("text-lg font-black leading-tight", isDark ? "text-white" : "text-slate-800")}>
          Escolha o plano ideal para o seu negócio
        </h2>
        <p className={cn("text-xs mt-1", isDark ? "text-white/35" : "text-slate-500")}>
          14 dias grátis em qualquer plano. Sem cartão de crédito.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const Icon = plan.icon
          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border p-5 flex flex-col gap-4 transition-all",
                isDark
                  ? plan.highlight
                    ? `bg-gradient-to-b ${plan.color} ${plan.border} shadow-lg shadow-primary/10`
                    : `bg-white/[0.03] ${plan.border} hover:bg-white/[0.05]`
                  : plan.highlight
                    ? `bg-gradient-to-b from-primary/5 to-white border-primary/30 shadow-lg shadow-primary/10`
                    : `bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow`,
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-primary/30 uppercase tracking-wider">
                    Mais popular
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className={cn("inline-flex items-center gap-1.5 text-xs font-semibold mb-1", plan.iconColor)}>
                    <Icon className="size-3.5" />
                    {plan.name}
                  </div>
                  <p className={cn("text-xs", isDark ? "text-white/40" : "text-slate-500")}>{plan.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-2xl font-black leading-none", isDark ? "text-white" : "text-slate-800")}>{plan.price}</p>
                  <p className={cn("text-[10px]", isDark ? "text-white/30" : "text-slate-400")}>{plan.period}</p>
                </div>
              </div>

              {/* Divider */}
              <div className={cn("h-px", isDark ? "bg-white/8" : "bg-slate-100")} />

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className={cn("size-3.5 shrink-0", isDark ? "text-emerald-400" : "text-emerald-500")} />
                    <span className={cn("text-xs", isDark ? "text-white/60" : "text-slate-600")}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/sign-up"
                className={cn(
                  "flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold transition-all",
                  plan.highlight
                    ? "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/25"
                    : isDark
                      ? "bg-white/8 text-white/70 hover:bg-white/15 border border-white/10"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                )}
              >
                Começar grátis
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

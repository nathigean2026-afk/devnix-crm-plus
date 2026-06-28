"use client"

import { Check, Lock, Zap, CalendarDays, CalendarRange, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Fonte de verdade — espelha lib/products.ts ───────────────────────────────
// Start:      R$ 7,00   / 7 dias
// Business:   R$ 24,00  / 30 dias
// Enterprise: R$ 260,00 / 1 ano

type Feature = { text: string; locked?: boolean; since?: "business" | "enterprise" }

const plans = [
  {
    id: "start",
    name: "Start",
    duration: "7 dias",
    price: "R$ 7",
    cents: ",00",
    period: "acesso por 7 dias",
    desc: "Teste a plataforma completa antes de assinar.",
    icon: Zap,
    iconColor: "text-sky-400",
    highlight: false,
    badge: null as string | null,
    accentClass: "border-slate-200 dark:border-white/10",
    features: [
      { text: "Clientes ilimitados" },
      { text: "Ordens de Serviço ilimitadas" },
      { text: "Orçamentos ilimitados" },
      { text: "Financeiro (receitas e despesas)" },
      { text: "Pagamento via Pix" },
      { text: "Suporte por e-mail" },
      { text: "Personalização de marca (logo, CNPJ, cor)", locked: true, since: "business" as const },
      { text: "Notificações de resposta de orçamento", locked: true, since: "business" as const },
      { text: "Funcionário auxiliar + permissões", locked: true, since: "enterprise" as const },
    ] as Feature[],
  },
  {
    id: "business",
    name: "Business",
    duration: "30 dias",
    price: "R$ 24",
    cents: ",00",
    period: "por mês",
    desc: "Para profissionais que precisam da marca própria e controle total.",
    icon: CalendarDays,
    iconColor: "text-primary",
    highlight: true,
    badge: "Mais popular",
    accentClass: "border-primary/40",
    features: [
      { text: "Clientes ilimitados" },
      { text: "Ordens de Serviço ilimitadas" },
      { text: "Orçamentos ilimitados" },
      { text: "Financeiro completo + relatórios" },
      { text: "Pagamento via Pix" },
      { text: "Personalização completa da marca" },
      { text: "Logo, nome e CNPJ nos documentos" },
      { text: "Cor de destaque personalizada" },
      { text: "Notificações de resposta de orçamento" },
      { text: "Suporte prioritário" },
      { text: "Funcionário auxiliar + permissões", locked: true, since: "enterprise" as const },
    ] as Feature[],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    duration: "1 ano",
    price: "R$ 260",
    cents: ",00",
    period: "por ano",
    desc: "Melhor custo-benefício com funcionário auxiliar incluso.",
    icon: CalendarRange,
    iconColor: "text-amber-400",
    highlight: false,
    badge: "Melhor valor",
    accentClass: "border-amber-500/30",
    features: [
      { text: "Tudo do Business" },
      { text: "1 funcionário auxiliar incluso" },
      { text: "Painel de permissões do funcionário" },
      { text: "Acesso por 12 meses completos" },
      { text: "Economia de R$ 28 vs mensalidade" },
      { text: "Suporte VIP" },
    ] as Feature[],
  },
]

const SINCE_LABEL: Record<string, string> = {
  business: "a partir do Business",
  enterprise: "apenas no Enterprise",
}

interface PricingCardsProps {
  isDark: boolean
}

export function PricingCards({ isDark }: PricingCardsProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-12">

      {/* Título */}
      <div className="text-center mb-8">
        <p className={cn(
          "text-[11px] font-semibold uppercase tracking-widest mb-2",
          isDark ? "text-primary/60" : "text-primary/70",
        )}>
          Planos e Preços
        </p>
        <h2 className={cn(
          "text-xl font-black leading-tight text-balance",
          isDark ? "text-white" : "text-slate-900",
        )}>
          Escolha o plano ideal para o seu negócio
        </h2>
        <p className={cn("text-xs mt-1.5", isDark ? "text-white/35" : "text-slate-500")}>
          Pagamento único · Sem assinatura automática · Ativação instantânea
        </p>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon
          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border flex flex-col transition-all",
                plan.highlight
                  ? isDark
                    ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                    : "bg-gradient-to-b from-primary/5 to-white border-primary/30 shadow-lg shadow-primary/10 ring-1 ring-primary/15"
                  : isDark
                    ? `bg-white/[0.03] ${plan.accentClass} hover:bg-white/[0.05]`
                    : `bg-white ${plan.accentClass} shadow-sm hover:shadow`,
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={cn(
                    "text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide",
                    plan.highlight
                      ? "bg-primary text-white shadow-primary/30"
                      : "bg-amber-500 text-white shadow-amber-500/30",
                  )}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-5 flex flex-col flex-1 gap-4">

                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className={cn("flex items-center gap-1.5 text-xs font-bold mb-0.5", plan.iconColor)}>
                      <Icon className="size-3.5" />
                      {plan.name}
                    </div>
                    <p className={cn("text-[11px]", isDark ? "text-white/40" : "text-slate-500")}>
                      {plan.duration}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-2xl font-black leading-none", isDark ? "text-white" : "text-slate-800")}>
                      {plan.price}
                      <span className={cn("text-sm font-semibold", isDark ? "text-white/50" : "text-slate-500")}>
                        {plan.cents}
                      </span>
                    </p>
                    <p className={cn("text-[10px] mt-0.5", isDark ? "text-white/30" : "text-slate-400")}>
                      {plan.period}
                    </p>
                  </div>
                </div>

                {/* Descrição */}
                <p className={cn("text-[11px] leading-relaxed", isDark ? "text-white/45" : "text-slate-500")}>
                  {plan.desc}
                </p>

                {/* Divider */}
                <div className={cn("h-px", isDark ? "bg-white/8" : "bg-slate-100")} />

                {/* Features */}
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className={cn("flex items-start gap-2", f.locked && "opacity-50")}>
                      <div className={cn(
                        "size-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        f.locked
                          ? isDark ? "bg-white/8" : "bg-slate-100"
                          : plan.highlight
                            ? "bg-primary/20"
                            : isDark ? "bg-white/10" : "bg-slate-100",
                      )}>
                        {f.locked
                          ? <Lock className={cn("size-2 shrink-0", isDark ? "text-white/40" : "text-slate-400")} strokeWidth={2.5} />
                          : <Check className={cn("size-2.5 shrink-0", plan.highlight ? "text-primary" : isDark ? "text-white/60" : "text-slate-500")} strokeWidth={3} />
                        }
                      </div>
                      <div className="min-w-0">
                        <span className={cn(
                          "text-xs leading-relaxed",
                          f.locked
                            ? cn(isDark ? "text-white/40" : "text-slate-400", "line-through")
                            : isDark ? "text-white/70" : "text-slate-600",
                        )}>
                          {f.text}
                        </span>
                        {f.locked && f.since && (
                          <span className={cn(
                            "block text-[10px] font-medium mt-0.5",
                            f.since === "business" ? "text-primary/70" : "text-amber-500/80",
                          )}>
                            {SINCE_LABEL[f.since]}
                          </span>
                        )}
                      </div>
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
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
                  )}
                >
                  Começar agora
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rodapé */}
      <p className={cn("text-center text-[10px] mt-5", isDark ? "text-white/20" : "text-slate-400")}>
        Pagamento via Pix, cartão de crédito ou boleto · Processado pelo Mercado Pago
      </p>
    </div>
  )
}

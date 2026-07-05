"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Check, X, ChevronDown, ChevronUp,
  Zap, CalendarDays, CalendarRange,
  ShieldCheck, Clock, Sparkles, Lock, UsersRound, FileText, BarChart3,
  MessageSquare, Palette, UserPlus, ArrowRight, Star, Sun, Moon,
  Bolt, CreditCard, BadgeCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Dados dos planos ──────────────────────────────────────────────────────────
const plans = [
  {
    id: "start",
    name: "Start",
    tagline: "7 dias de acesso",
    price: 7,
    priceNote: "pagamento único",
    period: "7 dias de acesso completo",
    desc: "Teste a plataforma inteira sem restrições. Ideal para conhecer o sistema antes de assinar um plano maior.",
    icon: Zap,
    highlight: false,
    badge: null as string | null,
    cta: "Começar agora",
    ctaHref: "/sign-up",
    features: [
      "Clientes, OS e orçamentos ilimitados",
      "Financeiro completo",
      "Catálogo de serviços",
      "Link público de orçamento",
      "Pagamento via Pix",
      "Código promocional",
      "Relatórios e gráficos",
      "Suporte via e-mail",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "30 dias de acesso",
    price: 30,
    priceNote: "por mês",
    period: "renovável mensalmente",
    desc: "Para profissionais que querem apresentar uma marca profissional nos documentos e receber notificações em tempo real.",
    icon: CalendarDays,
    highlight: true,
    badge: "Mais popular",
    cta: "Escolher Business",
    ctaHref: "/sign-up",
    features: [
      "Tudo do plano Start",
      "Logo e nome da empresa nos PDFs",
      "CNPJ no cabeçalho dos documentos",
      "Cor de destaque personalizada",
      "Notificações de resposta de orçamento",
      "Suporte prioritário",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "360 dias de acesso",
    price: 280,
    priceNote: "por ano",
    period: "Equivale a R$ 23,33/mês",
    desc: "Melhor custo-benefício com 1 funcionário auxiliar incluso. Permissões individuais por módulo para cada membro da equipe.",
    icon: CalendarRange,
    highlight: false,
    badge: "Melhor valor",
    cta: "Escolher Enterprise",
    ctaHref: "/sign-up",
    features: [
      "Tudo do plano Business",
      "360 dias de acesso (economia de R$ 80)",
      "1 funcionário auxiliar incluso",
      "Permissões por módulo por usuário",
      "Suporte VIP com atendimento prioritário",
    ],
  },
]

// ── Tabela de features completa ───────────────────────────────────────────────
const featureGroups = [
  {
    label: "Funcionalidades base",
    icon: FileText,
    rows: [
      { name: "Cadastro de clientes ilimitado", start: true, business: true, enterprise: true },
      { name: "Catálogo de serviços", start: true, business: true, enterprise: true },
      { name: "Ordens de serviço ilimitadas", start: true, business: true, enterprise: true },
      { name: "Orçamentos ilimitados", start: true, business: true, enterprise: true },
      { name: "Link público para visualizar orçamento", start: true, business: true, enterprise: true },
      { name: "Financeiro (receitas e despesas)", start: true, business: true, enterprise: true },
      { name: "Pagamento via Pix (integrado)", start: true, business: true, enterprise: true },
      { name: "Código promocional em orçamentos", start: true, business: true, enterprise: true },
    ],
  },
  {
    label: "Relatórios e dados",
    icon: BarChart3,
    rows: [
      { name: "Relatórios de faturamento", start: true, business: true, enterprise: true },
      { name: "Gráficos de desempenho mensal", start: true, business: true, enterprise: true },
      { name: "Histórico completo de clientes", start: true, business: true, enterprise: true },
    ],
  },
  {
    label: "Marca própria",
    icon: Palette,
    rows: [
      { name: "Logo nos documentos e PDFs", start: false, business: true, enterprise: true },
      { name: "Nome da empresa nos documentos", start: false, business: true, enterprise: true },
      { name: "CNPJ no cabeçalho dos documentos", start: false, business: true, enterprise: true },
      { name: "Cor de destaque personalizada", start: false, business: true, enterprise: true },
      { name: "Notificações de resposta de orçamento", start: false, business: true, enterprise: true },
    ],
  },
  {
    label: "Suporte",
    icon: MessageSquare,
    rows: [
      { name: "Tickets de suporte", start: true, business: true, enterprise: true },
      { name: "Suporte por e-mail", start: true, business: false, enterprise: false },
      { name: "Suporte prioritário", start: false, business: true, enterprise: true },
      { name: "Suporte VIP dedicado", start: false, business: false, enterprise: true },
    ],
  },
  {
    label: "Funcionário auxiliar",
    icon: UserPlus,
    rows: [
      { name: "1 funcionário auxiliar incluso", start: false, business: false, enterprise: true },
      { name: "Permissão: acesso a clientes", start: false, business: false, enterprise: true },
      { name: "Permissão: acesso a serviços", start: false, business: false, enterprise: true },
      { name: "Permissão: acesso a orçamentos", start: false, business: false, enterprise: true },
      { name: "Permissão: acesso a ordens de serviço", start: false, business: false, enterprise: true },
      { name: "Permissão: acesso ao financeiro", start: false, business: false, enterprise: true },
      { name: "Permissão: acesso a relatórios", start: false, business: false, enterprise: true },
    ],
  },
  {
    label: "Vigência e pagamento",
    icon: Clock,
    rows: [
      { name: "Dias de acesso", start: "7 dias" as string | boolean, business: "30 dias" as string | boolean, enterprise: "360 dias" as string | boolean },
      { name: "Renovação automática", start: false, business: false, enterprise: false },
      { name: "Modelo de cobrança", start: "Único" as string | boolean, business: "Único" as string | boolean, enterprise: "Único" as string | boolean },
      { name: "Forma de pagamento", start: "Pix" as string | boolean, business: "Pix" as string | boolean, enterprise: "Pix" as string | boolean },
    ],
  },
]

const faqs = [
  {
    q: "O pagamento é recorrente (assinatura)?",
    a: "Não. Todos os planos são pagamentos únicos e avulsos. Você não é cobrado automaticamente — quando o período vence, basta renovar quando quiser e pelo plano que preferir. Sem surpresas na fatura.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Atualmente aceitamos Pix. O sistema confirma o pagamento de forma automática e sua licença é ativada instantaneamente após a confirmação, sem necessidade de contato manual.",
  },
  {
    q: "Posso mudar de plano ao renovar?",
    a: "Sim. A cada renovação você pode escolher qualquer plano disponível — Start, Business ou Enterprise. Não há fidelidade ou penalidade por mudar.",
  },
  {
    q: "O que é o funcionário auxiliar do Enterprise?",
    a: "É a possibilidade de cadastrar 1 usuário adicional (funcionário, sócio ou assistente) com acesso ao sistema. Você define individualmente quais módulos ele pode acessar: clientes, serviços, orçamentos, ordens de serviço, financeiro e relatórios. O acesso fica ativo enquanto a licença Enterprise estiver vigente.",
  },
  {
    q: "A personalização de marca aparece em todos os documentos?",
    a: "Sim. Nos planos Business e Enterprise, seu logotipo, nome da empresa, CNPJ e cor de destaque aparecem automaticamente em orçamentos, ordens de serviço e recibos gerados pelo sistema.",
  },
  {
    q: "Quanto economizo com Enterprise versus Business mensal?",
    a: "O Business custa R$ 30/mês. Em 12 meses seriam R$ 360. O Enterprise cobre 360 dias por R$ 280 — uma economia de R$ 80 (equivale a R$ 23,33 por mês). Além disso, você ainda ganha o funcionário auxiliar incluso sem custo adicional.",
  },
  {
    q: "O que acontece quando minha licença vence?",
    a: "Seus dados ficam armazenados e seguros. Você continua com acesso de leitura para consultar histórico. Para criar novas ordens de serviço, orçamentos ou registros financeiros, basta renovar com o plano de sua escolha.",
  },
  {
    q: "Existe período de teste gratuito?",
    a: "O plano Start (R$ 7 por 7 dias) foi criado exatamente para isso — é a forma de conhecer e testar toda a plataforma com custo mínimo antes de escolher um plano maior. Não há trial gratuito separado.",
  },
]

// ── Componentes auxiliares ────────────────────────────────────────────────────
function ThemeToggleButton({ isDark }: { isDark: boolean }) {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="size-8" />
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="size-8 rounded-full flex items-center justify-center transition-all duration-200 border"
      style={{
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
        color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)",
      }}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </button>
  )
}

function CellIcon({ value, isHighlight, isDark }: { value: boolean | string; isHighlight?: boolean; isDark?: boolean }) {
  // Card Business (isHighlight): fundo preto no light-mode, fundo branco no dark-mode
  // → texto precisa ser o inverso do fundo do card, não do tema global
  const highlightTextColor = isDark ? "#0a0a0a" : "#f2f2f2"
  const normalTextColor = isDark ? "rgba(242,242,242,0.85)" : "rgba(10,10,10,0.85)"

  if (typeof value === "string") {
    return (
      <span
        className="text-[11px] font-bold tabular-nums"
        style={{ color: isHighlight ? highlightTextColor : normalTextColor }}
      >
        {value}
      </span>
    )
  }

  if (value) {
    // Check verde vibrante — sempre legível em qualquer fundo
    const checkBg = isHighlight
      ? (isDark ? "rgba(10,10,10,0.15)" : "rgba(242,242,242,0.18)")
      : (isDark ? "rgba(34,197,94,0.15)" : "rgba(22,163,74,0.1)")
    const checkColor = isHighlight
      ? highlightTextColor
      : (isDark ? "#4ade80" : "#16a34a") // verde legível no tema
    return (
      <div
        className="size-6 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: checkBg }}
      >
        <Check className="size-3.5" strokeWidth={3} style={{ color: checkColor }} />
      </div>
    )
  }

  // X — vermelho apagado, claramente indica "não incluso" sem chamar atenção demais
  const xColor = isHighlight
    ? (isDark ? "rgba(10,10,10,0.25)" : "rgba(242,242,242,0.3)")
    : (isDark ? "rgba(248,113,113,0.45)" : "rgba(220,38,38,0.35)")
  return (
    <div className="size-6 flex items-center justify-center mx-auto">
      <X className="size-4" strokeWidth={2.5} style={{ color: xColor }} />
    </div>
  )
}

function FaqItem({ q, a, isDark }: { q: string; a: string; isDark: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border-b last:border-0"
      style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span
          className="text-sm font-semibold leading-snug"
          style={{ color: isDark ? "#f2f2f2" : "#0a0a0a" }}
        >
          {q}
        </span>
        <span
          className="size-6 rounded-full flex items-center justify-center shrink-0 border"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            color: isDark ? "rgba(242,242,242,0.4)" : "rgba(10,10,10,0.35)",
          }}
        >
          {open
            ? <ChevronUp className="size-3" />
            : <ChevronDown className="size-3" />}
        </span>
      </button>
      {open && (
        <p
          className="text-sm leading-relaxed pb-5 pr-10"
          style={{ color: isDark ? "rgba(242,242,242,0.5)" : "rgba(10,10,10,0.5)" }}
        >
          {a}
        </p>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PlanosPublicoPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isDark = !mounted ? true : resolvedTheme === "dark"

  const bg        = isDark ? "#080808" : "#f8f8f8"
  const fg        = isDark ? "#f2f2f2" : "#0a0a0a"
  const fgMuted   = isDark ? "rgba(242,242,242,0.42)" : "rgba(10,10,10,0.42)"
  const fgSub     = isDark ? "rgba(242,242,242,0.28)" : "rgba(10,10,10,0.28)"
  const cardBg    = isDark ? "#111111" : "#ffffff"
  const cardBorder= isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"
  const highlightBg   = isDark ? "#f2f2f2" : "#0a0a0a"
  const highlightFg   = isDark ? "#0a0a0a" : "#f2f2f2"

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg, color: fg, fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)" }}>

      {/* Grid pattern — light: linhas cinza / dark: linhas escuras sutis */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
            : "linear-gradient(rgba(0,0,0,0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.065) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          backgroundColor: isDark ? "rgba(8,8,8,0.82)" : "rgba(248,248,248,0.82)",
          borderColor: cardBorder,
        }}
      >
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/sign-in" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/elevanthe-icon.png"
              alt="Elevanthe CRM"
              width={26}
              height={26}
              style={{ width: 26, height: 26 }}
              className="object-contain"
            />
            <span className="font-black text-sm tracking-tight hidden sm:block" style={{ color: fg }}>
              Elevanthe CRM
            </span>
          </Link>
          <nav className="flex items-center gap-2.5">
            <ThemeToggleButton isDark={isDark} />
            <Link
              href="/sign-in"
              className="text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all hover:opacity-80"
              style={{ color: fgMuted, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
            >
              Entrar
            </Link>
            <Link
              href="/sign-up"
              className="text-xs font-bold px-4 py-2 rounded-full transition-all hover:opacity-85"
              style={{ backgroundColor: highlightBg, color: highlightFg }}
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── Hero ── */}
        <div className="pt-20 pb-14 text-center">
          <div
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border mb-7"
            style={{ borderColor: cardBorder, color: fgMuted }}
          >
            <Sparkles className="size-3" />
            Planos e preços
          </div>

          <h1
            className="text-[clamp(2.8rem,8vw,5rem)] font-black tracking-tighter leading-[1.02] text-balance mb-5"
            style={{ color: fg }}
          >
            Simples,<br className="hidden sm:block" />
            sem surpresas.
          </h1>
          <p className="text-base max-w-xl mx-auto leading-relaxed mb-5" style={{ color: fgMuted }}>
            Pague uma vez, use o tempo inteiro. Sem assinatura automática, sem renovação forçada — você decide quando e se renova.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: fgSub }}>
            <span className="flex items-center gap-1.5">
              <Lock className="size-3" />
              Pagamento via Pix
            </span>
            <span className="size-1 rounded-full" style={{ backgroundColor: fgSub }} />
            <span className="flex items-center gap-1.5">
              <Bolt className="size-3" />
              Ativação instantânea
            </span>
            <span className="size-1 rounded-full" style={{ backgroundColor: fgSub }} />
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="size-3" />
              Sem renovação automática
            </span>
          </div>
        </div>

        {/* ── Cards de planos ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-24">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isH = plan.highlight

            return (
              <div
                key={plan.id}
                className="relative flex flex-col rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: isH ? highlightBg : cardBg,
                  border: `1px solid ${isH ? highlightBg : cardBorder}`,
                  transform: isH ? "scale(1.025)" : undefined,
                  boxShadow: isH ? (isDark ? "0 0 0 1px rgba(255,255,255,0.12), 0 20px 60px rgba(0,0,0,0.5)" : "0 0 0 1px rgba(0,0,0,0.2), 0 20px 60px rgba(0,0,0,0.15)") : undefined,
                }}
              >
                {/* Grid sutil no card de destaque */}
                {isH && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: isDark
                        ? "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)"
                        : "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                    }}
                  />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div
                    className="flex items-center justify-center py-1.5 border-b text-[11px] font-bold tracking-wide uppercase"
                    style={{
                      backgroundColor: isH
                        ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")
                        : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"),
                      borderColor: isH
                        ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")
                        : cardBorder,
                      color: isH ? highlightFg : fgMuted,
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="relative z-10 p-6 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2
                        className="text-xl font-black tracking-tight leading-none mb-1"
                        style={{ color: isH ? highlightFg : fg }}
                      >
                        {plan.name}
                      </h2>
                      <p className="text-xs" style={{ color: isH ? (isDark ? "rgba(10,10,10,0.5)" : "rgba(242,242,242,0.55)") : fgMuted }}>
                        {plan.tagline}
                      </p>
                    </div>
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isH
                          ? (isDark ? "rgba(10,10,10,0.12)" : "rgba(242,242,242,0.15)")
                          : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
                      }}
                    >
                      <Icon className="size-4.5" style={{ color: isH ? (isDark ? "rgba(10,10,10,0.7)" : "rgba(242,242,242,0.7)") : fgMuted }} />
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-0.5 mb-1">
                      <span
                        className="text-sm font-medium mr-0.5"
                        style={{ color: isH ? (isDark ? "rgba(10,10,10,0.45)" : "rgba(242,242,242,0.5)") : fgMuted }}
                      >
                        R$
                      </span>
                      <span
                        className="text-[3.2rem] font-black tracking-tighter leading-none"
                        style={{ color: isH ? highlightFg : fg }}
                      >
                        {plan.price}
                      </span>
                      <span
                        className="text-sm ml-1"
                        style={{ color: isH ? (isDark ? "rgba(10,10,10,0.45)" : "rgba(242,242,242,0.5)") : fgMuted }}
                      >
                        ,00
                      </span>
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: isH ? (isDark ? "rgba(10,10,10,0.45)" : "rgba(242,242,242,0.5)") : fgMuted }}
                    >
                      {plan.priceNote}
                    </p>
                    {plan.id === "enterprise" && (
                      <p
                        className="text-xs font-semibold mt-1"
                        style={{ color: isH ? (isDark ? "rgba(10,10,10,0.65)" : "#16a34a") : "#16a34a" }}
                      >
                        Economia de R$ 80 vs. Business mensal
                      </p>
                    )}
                  </div>

                  <div
                    className="my-4 h-px"
                    style={{ backgroundColor: isH ? (isDark ? "rgba(10,10,10,0.12)" : "rgba(242,242,242,0.18)") : cardBorder }}
                  />

                  {/* Descrição */}
                  <p
                    className="text-sm leading-relaxed mb-5"
                    style={{ color: isH ? (isDark ? "rgba(10,10,10,0.58)" : "rgba(242,242,242,0.65)") : fgMuted }}
                  >
                    {plan.desc}
                  </p>

                  {/* Lista de features */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-xs" style={{ color: isH ? (isDark ? "rgba(10,10,10,0.75)" : "rgba(242,242,242,0.8)") : fgMuted }}>
                        <span
                          className="size-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            backgroundColor: isH
                              ? (isDark ? "rgba(10,10,10,0.12)" : "rgba(242,242,242,0.16)")
                              : (isDark ? "rgba(34,197,94,0.15)" : "rgba(22,163,74,0.1)"),
                          }}
                        >
                          <Check
                            className="size-2.5"
                            strokeWidth={3.5}
                            style={{
                              color: isH
                                ? (isDark ? "#0a0a0a" : "#f2f2f2")
                                : (isDark ? "#4ade80" : "#16a34a"),
                            }}
                          />
                        </span>
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.ctaHref}
                    className="w-full h-11 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-85"
                    style={{
                      backgroundColor: isH ? (isDark ? "#0a0a0a" : "#f2f2f2") : highlightBg,
                      color: isH ? (isDark ? "#f2f2f2" : "#0a0a0a") : highlightFg,
                    }}
                  >
                    {plan.cta}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Tabela comparativa ── */}
        <section id="comparativo" className="mb-24">
          <div className="text-center mb-12">
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: fgSub }}
            >
              Comparativo completo
            </p>
            <h2
              className="text-[clamp(1.9rem,5vw,3rem)] font-black tracking-tighter leading-tight text-balance"
              style={{ color: fg }}
            >
              O que cada plano inclui.
            </h2>
          </div>

          {/* Legenda de símbolos */}
          <div className="flex items-center gap-5 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div
                className="size-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isDark ? "rgba(34,197,94,0.15)" : "rgba(22,163,74,0.1)" }}
              >
                <Check className="size-3" strokeWidth={3} style={{ color: isDark ? "#4ade80" : "#16a34a" }} />
              </div>
              <span className="text-xs" style={{ color: fgSub }}>Incluso no plano</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-5 flex items-center justify-center">
                <X className="size-3.5" strokeWidth={2.5} style={{ color: isDark ? "rgba(248,113,113,0.45)" : "rgba(220,38,38,0.35)" }} />
              </div>
              <span className="text-xs" style={{ color: fgSub }}>Não incluso</span>
            </div>
          </div>

          {/* Tabela responsiva */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${cardBorder}` }}
          >
            {/* Header */}
            <div
              className="grid grid-cols-4 border-b"
              style={{ backgroundColor: isDark ? "#0d0d0d" : "#f2f2f2", borderColor: cardBorder }}
            >
              <div
                className="p-5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: fgSub }}
              >
                Funcionalidade
              </div>
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="p-5 text-center"
                  style={{ backgroundColor: p.highlight ? highlightBg : undefined }}
                >
                  <p
                    className="text-sm font-black tracking-tight"
                    style={{ color: p.highlight ? highlightFg : fg }}
                  >
                    {p.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: p.highlight ? (isDark ? "rgba(10,10,10,0.45)" : "rgba(242,242,242,0.5)") : fgMuted }}
                  >
                    R$ {p.price}
                  </p>
                </div>
              ))}
            </div>

            {featureGroups.map((group, gi) => {
              const GroupIcon = group.icon
              return (
                <div key={group.label}>
                  {/* Categoria */}
                  <div
                    className="flex items-center gap-2 px-5 py-2.5 border-b"
                    style={{
                      backgroundColor: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)",
                      borderColor: cardBorder,
                    }}
                  >
                    <GroupIcon className="size-3.5" style={{ color: fgMuted }} />
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: fgMuted }}
                    >
                      {group.label}
                    </span>
                  </div>

                  {group.rows.map((row, i) => (
                    <div
                      key={row.name}
                      className="grid grid-cols-4 border-b"
                      style={{
                        borderColor: i === group.rows.length - 1 && gi === featureGroups.length - 1
                          ? "transparent"
                          : cardBorder,
                        backgroundColor: i % 2 === 1 ? (isDark ? "rgba(255,255,255,0.012)" : "rgba(0,0,0,0.012)") : "transparent",
                      }}
                    >
                      <div
                        className="px-5 py-3 text-[13px] flex items-center"
                        style={{ color: isDark ? "rgba(242,242,242,0.65)" : "rgba(10,10,10,0.65)" }}
                      >
                        {row.name}
                      </div>
                      {(["start", "business", "enterprise"] as const).map((planId, idx) => (
                        <div
                          key={planId}
                          className="px-3 py-3 flex items-center justify-center"
                          style={{ backgroundColor: idx === 1 ? highlightBg : undefined }}
                        >
                          <CellIcon
                            value={row[planId] as boolean | string}
                            isHighlight={idx === 1}
                            isDark={isDark}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )
            })}

            {/* Footer da tabela */}
            <div
              className="grid grid-cols-4 border-t"
              style={{ backgroundColor: isDark ? "#0d0d0d" : "#f2f2f2", borderColor: cardBorder }}
            >
              <div className="p-5 text-xs font-semibold" style={{ color: fgSub }}>
                Começar agora
              </div>
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="p-4 flex items-center justify-center"
                  style={{ backgroundColor: p.highlight ? highlightBg : undefined }}
                >
                  <Link
                    href={p.ctaHref}
                    className="text-xs font-bold px-5 py-2.5 rounded-full transition-all hover:opacity-80"
                    style={{
                      backgroundColor: p.highlight ? (isDark ? "#0a0a0a" : "#f2f2f2") : highlightBg,
                      color: p.highlight ? (isDark ? "#f2f2f2" : "#0a0a0a") : highlightFg,
                    }}
                  >
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Por que escolher ── */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2
              className="text-[clamp(1.6rem,4vw,2.4rem)] font-black tracking-tighter"
              style={{ color: fg }}
            >
              Simples de usar. Sério nos resultados.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "Sem cobrança automática",
                desc: "Nenhuma assinatura recorrente. Você decide quando renova, pelo plano que quiser. Sem cobranças surpresa no cartão ou na conta.",
              },
              {
                icon: Sparkles,
                title: "Ativação instantânea",
                desc: "Sua licença é ativada automaticamente após confirmação do Pix. Sem espera, sem aprovação manual — começa a usar na hora.",
              },
              {
                icon: Star,
                title: "Suporte humano de verdade",
                desc: "Atendimento real via ticket ou WhatsApp. Sem bots, sem fila automática. Pessoas que conhecem o sistema e resolvem o seu problema.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-4 p-6 rounded-2xl border"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <div
                  className="size-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                >
                  <Icon className="size-5" style={{ color: fg }} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: fg }}>{title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: fgMuted }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: fgSub }}
            >
              FAQ
            </p>
            <h2
              className="text-[clamp(1.8rem,4.5vw,2.8rem)] font-black tracking-tighter"
              style={{ color: fg }}
            >
              Perguntas frequentes.
            </h2>
          </div>

          <div
            className="max-w-2xl mx-auto rounded-2xl border divide-y-0 px-6"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} isDark={isDark} />
            ))}
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="mb-24 text-center">
          <div
            className="relative rounded-2xl overflow-hidden p-12 sm:p-16"
            style={{ backgroundColor: highlightBg }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: isDark
                  ? "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)"
                  : "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative z-10">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest mb-5"
                style={{ color: isDark ? "rgba(10,10,10,0.35)" : "rgba(242,242,242,0.4)" }}
              >
                Comece hoje
              </p>
              <h2
                className="text-[clamp(2.2rem,5.5vw,3.6rem)] font-black tracking-tighter leading-tight text-balance mb-4"
                style={{ color: highlightFg }}
              >
                Pronto para organizar<br />seu negócio?
              </h2>
              <p
                className="text-sm mb-8 max-w-md mx-auto leading-relaxed"
                style={{ color: isDark ? "rgba(10,10,10,0.52)" : "rgba(242,242,242,0.6)" }}
              >
                Crie sua conta gratuitamente e escolha o plano dentro do sistema. Sem cartão de crédito, sem burocracia.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/sign-up"
                  className="h-12 px-8 rounded-full text-sm font-bold flex items-center gap-2 transition-all hover:opacity-85"
                  style={{ backgroundColor: highlightFg, color: highlightBg }}
                >
                  Criar conta grátis
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/sign-in"
                  className="h-12 px-8 rounded-full border text-sm font-medium flex items-center gap-2 transition-all hover:opacity-70"
                  style={{
                    borderColor: isDark ? "rgba(10,10,10,0.25)" : "rgba(242,242,242,0.25)",
                    color: isDark ? "rgba(10,10,10,0.55)" : "rgba(242,242,242,0.65)",
                  }}
                >
                  Já tenho conta
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer
        className="border-t py-8 relative z-10"
        style={{ borderColor: cardBorder }}
      >
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/elevanthe-icon.png"
              alt=""
              width={18}
              height={18}
              style={{ width: 18, height: 18 }}
              className="object-contain opacity-50"
            />
            <span className="text-xs" style={{ color: fgSub }}>
              &copy; {new Date().getFullYear()} Elevanthe. Todos os direitos reservados.
            </span>
          </div>
          <div className="flex items-center gap-5">
            {[
              { label: "Entrar", href: "/sign-in" },
              { label: "Criar conta", href: "/sign-up" },
              { label: "Demo", href: "/demo" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs transition-colors hover:opacity-70"
                style={{ color: fgSub }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

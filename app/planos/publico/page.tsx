"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect } from "react"
import {
  Check, X, ChevronDown, ChevronUp,
  Zap, CalendarDays, CalendarRange,
  ShieldCheck, Clock, Sparkles, Lock, Users, FileText, BarChart3,
  MessageSquare, Palette, UserPlus, ArrowRight, Star, Sun, Moon,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Dados dos planos ──────────────────────────────────────────────────────────
const plans = [
  {
    id: "start",
    name: "Start",
    duration: "7 dias",
    price: 7,
    priceNote: "pagamento único",
    period: "acesso por 7 dias",
    desc: "Experimente a plataforma completa. Ideal para avaliar antes de assinar.",
    icon: Zap,
    highlight: false,
    badge: null as string | null,
    cta: "Começar agora",
    ctaHref: "/sign-up",
  },
  {
    id: "business",
    name: "Business",
    duration: "30 dias",
    price: 30,
    priceNote: "por mês",
    period: "renovável mensalmente",
    desc: "Para profissionais que precisam de marca própria e notificações de orçamento.",
    icon: CalendarDays,
    highlight: true,
    badge: "Mais popular",
    cta: "Escolher Business",
    ctaHref: "/sign-up",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    duration: "360 dias",
    price: 280,
    priceNote: "por ano",
    period: "equivale a R$ 23,33/mês",
    desc: "Melhor custo-benefício com funcionário auxiliar incluso por 360 dias.",
    icon: CalendarRange,
    highlight: false,
    badge: "Melhor valor",
    cta: "Escolher Enterprise",
    ctaHref: "/sign-up",
  },
]

// ── Tabela de features completa ───────────────────────────────────────────────
const featureGroups = [
  {
    label: "Base",
    icon: FileText,
    rows: [
      { name: "Cadastro de clientes", start: true, business: true, enterprise: true },
      { name: "Catálogo de serviços", start: true, business: true, enterprise: true },
      { name: "Ordens de Serviço ilimitadas", start: true, business: true, enterprise: true },
      { name: "Orçamentos ilimitados", start: true, business: true, enterprise: true },
      { name: "Link público para orçamentos", start: true, business: true, enterprise: true },
      { name: "Financeiro (receitas e despesas)", start: true, business: true, enterprise: true },
      { name: "Pagamento via Pix", start: true, business: true, enterprise: true },
      { name: "Código promocional", start: true, business: true, enterprise: true },
    ],
  },
  {
    label: "Relatórios",
    icon: BarChart3,
    rows: [
      { name: "Relatórios e gráficos", start: true, business: true, enterprise: true },
    ],
  },
  {
    label: "Suporte",
    icon: MessageSquare,
    rows: [
      { name: "Tickets de suporte", start: true, business: true, enterprise: true },
      { name: "Suporte por e-mail", start: true, business: false, enterprise: false },
      { name: "Suporte prioritário", start: false, business: true, enterprise: true },
      { name: "Suporte VIP", start: false, business: false, enterprise: true },
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
    label: "Funcionário auxiliar",
    icon: UserPlus,
    rows: [
      { name: "1 funcionário auxiliar incluso", start: false, business: false, enterprise: true },
      { name: "Permissão: Clientes", start: false, business: false, enterprise: true },
      { name: "Permissão: Serviços", start: false, business: false, enterprise: true },
      { name: "Permissão: Orçamentos", start: false, business: false, enterprise: true },
      { name: "Permissão: Ordens de Serviço", start: false, business: false, enterprise: true },
      { name: "Permissão: Financeiro", start: false, business: false, enterprise: true },
      { name: "Permissão: Relatórios", start: false, business: false, enterprise: true },
    ],
  },
  {
    label: "Vigência",
    icon: Clock,
    rows: [
      { name: "Dias de acesso", start: "7 dias" as string | boolean, business: "30 dias" as string | boolean, enterprise: "360 dias" as string | boolean },
      { name: "Renovação automática", start: false, business: false, enterprise: false },
    ],
  },
]

const faqs = [
  {
    q: "O pagamento é recorrente?",
    a: "Não. Todos os planos são pagamentos únicos. Você controla quando e se quer renovar, sem cobranças automáticas.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Aceitamos Pix com ativação instantânea após confirmação do pagamento.",
  },
  {
    q: "Posso mudar de plano depois?",
    a: "Sim. Ao renovar, você pode escolher qualquer plano disponível, inclusive subir para Business ou Enterprise.",
  },
  {
    q: "O que é o funcionário auxiliar do Enterprise?",
    a: "Você pode cadastrar 1 usuário adicional (funcionário, sócio ou assistente) com acesso ao sistema. É possível definir individualmente quais módulos ele pode acessar: clientes, serviços, orçamentos, OS, financeiro e relatórios.",
  },
  {
    q: "A personalização de marca aparece em todos os documentos?",
    a: "Sim. Nos planos Business e Enterprise, seu logotipo, nome da empresa, CNPJ e cor de destaque aparecem nos orçamentos, ordens de serviço e recibos.",
  },
  {
    q: "Quanto economizo com o Enterprise vs Business mensal?",
    a: "O Business custa R$ 30/mês. Em 12 meses seriam R$ 360. O Enterprise cobre 360 dias por R$ 280 — uma economia de R$ 80, equivalendo a R$ 23,33 por mês.",
  },
]

// ── Componentes auxiliares ────────────────────────────────────────────────────
function ThemeToggleButton() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="size-8" />
  const isDark = resolvedTheme === "dark"
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "size-8 rounded-full flex items-center justify-center transition-all duration-200 border",
        isDark
          ? "border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10"
          : "border-black/10 bg-black/5 text-black/40 hover:text-black/70 hover:bg-black/8"
      )}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </button>
  )
}

function CellIcon({ value, isHighlight }: { value: boolean | string; isHighlight?: boolean }) {
  if (typeof value === "string") {
    return (
      <span
        className="text-xs font-bold"
        style={{ color: isHighlight ? "#f2f2f2" : undefined }}
      >
        {value}
      </span>
    )
  }
  if (value) {
    return (
      <div
        className="size-5 rounded-full flex items-center justify-center mx-auto"
        style={{
          backgroundColor: isHighlight ? "rgba(242,242,242,0.15)" : "rgba(10,10,10,0.06)",
        }}
      >
        <Check
          className="size-3"
          strokeWidth={3}
          style={{ color: isHighlight ? "#f2f2f2" : "#0a0a0a" }}
        />
      </div>
    )
  }
  return (
    <div className="size-5 rounded-full bg-transparent flex items-center justify-center mx-auto">
      <X className="size-3 text-current opacity-20" strokeWidth={2.5} />
    </div>
  )
}

function FaqItem({ q, a, isDark }: { q: string; a: string; isDark: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border-b last:border-0"
      style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span
          className="text-sm font-semibold"
          style={{ color: isDark ? "#f2f2f2" : "#0a0a0a" }}
        >
          {q}
        </span>
        {open
          ? <ChevronUp className="size-4 shrink-0" style={{ color: isDark ? "rgba(242,242,242,0.4)" : "rgba(0,0,0,0.35)" }} />
          : <ChevronDown className="size-4 shrink-0" style={{ color: isDark ? "rgba(242,242,242,0.4)" : "rgba(0,0,0,0.35)" }} />}
      </button>
      {open && (
        <p
          className="text-sm leading-relaxed pb-5"
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

  const isDark = !mounted || resolvedTheme === "dark"

  const bg = isDark ? "#080808" : "#f8f8f8"
  const fg = isDark ? "#f2f2f2" : "#0a0a0a"
  const fgMuted = isDark ? "rgba(242,242,242,0.45)" : "rgba(10,10,10,0.45)"
  const cardBg = isDark ? "#111111" : "#ffffff"
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
  const cardDark = isDark ? "#f2f2f2" : "#0a0a0a"
  const cardDarkFg = isDark ? "#0a0a0a" : "#f2f2f2"

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: bg, color: fg }}>
      {/* Dots pattern global */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: isDark
            ? "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)"
            : "radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          backgroundColor: isDark ? "rgba(8,8,8,0.85)" : "rgba(248,248,248,0.85)",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/sign-in" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/elevanthe-icon.png"
              alt="Elevanthe CRM"
              width={26}
              height={26}
              className="object-contain"
            />
            <span
              className="font-black text-sm tracking-tight hidden sm:block"
              style={{ color: fg, fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)" }}
            >
              Elevanthe CRM
            </span>
          </Link>
          <nav className="flex items-center gap-2.5">
            <ThemeToggleButton />
            <Link
              href="/sign-in"
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
              style={{
                color: fgMuted,
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              }}
            >
              Entrar
            </Link>
            <Link
              href="/sign-up"
              className="text-xs font-bold px-4 py-2 rounded-full transition-all"
              style={{ backgroundColor: cardDark, color: cardDarkFg }}
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
            style={{
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              color: fgMuted,
            }}
          >
            <Sparkles className="size-3" />
            Planos e preços
          </div>

          <h1
            className="text-[clamp(2.8rem,8vw,5rem)] font-black tracking-tighter leading-[1.02] text-balance mb-5"
            style={{
              color: fg,
              fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
            }}
          >
            Simples,<br className="hidden sm:block" />
            sem surpresas.
          </h1>
          <p className="text-base max-w-lg mx-auto leading-relaxed mb-4" style={{ color: fgMuted }}>
            Pague uma vez, use o tempo inteiro. Sem assinatura automática, sem renovação forçada.
          </p>
          <p
            className="text-xs flex items-center justify-center gap-1.5"
            style={{ color: isDark ? "rgba(242,242,242,0.25)" : "rgba(10,10,10,0.3)" }}
          >
            <Lock className="size-3" />
            Pagamento via Pix · Ativação instantânea
          </p>
        </div>

        {/* ── Cards de planos ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-20">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isHighlight = plan.highlight

            return (
              <div
                key={plan.id}
                className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  backgroundColor: isHighlight ? cardDark : cardBg,
                  border: isHighlight
                    ? `1px solid ${cardDark}`
                    : `1px solid ${cardBorder}`,
                  transform: isHighlight ? "scale(1.02)" : undefined,
                }}
              >
                {/* Dots pattern no card de destaque */}
                {isHighlight && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: isDark
                        ? "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)"
                        : "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[11px] font-bold"
                    style={{
                      backgroundColor: isHighlight ? (isDark ? "#f2f2f2" : "#0a0a0a") : (isDark ? "#1a1a1a" : "#f0f0f0"),
                      color: isHighlight ? (isDark ? "#0a0a0a" : "#f2f2f2") : fgMuted,
                      border: `1px solid ${isHighlight ? cardDark : cardBorder}`,
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="relative z-10 p-6 flex flex-col flex-1">
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2
                        className="text-lg font-black tracking-tight"
                        style={{
                          color: isHighlight ? cardDarkFg : fg,
                          fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
                        }}
                      >
                        {plan.name}
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: isHighlight ? (isDark ? "rgba(10,10,10,0.5)" : "rgba(242,242,242,0.5)") : fgMuted }}>
                        {plan.duration}
                      </p>
                    </div>
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isHighlight
                          ? (isDark ? "rgba(10,10,10,0.15)" : "rgba(242,242,242,0.15)")
                          : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
                      }}
                    >
                      <Icon
                        className="size-4"
                        style={{ color: isHighlight ? cardDarkFg : fgMuted }}
                      />
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="mb-1">
                    <div className="flex items-baseline gap-0.5">
                      <span
                        className="text-sm font-medium mr-0.5"
                        style={{ color: isHighlight ? (isDark ? "rgba(10,10,10,0.5)" : "rgba(242,242,242,0.5)") : fgMuted }}
                      >
                        R$
                      </span>
                      <span
                        className="text-5xl font-black tracking-tighter leading-none"
                        style={{
                          color: isHighlight ? cardDarkFg : fg,
                          fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
                        }}
                      >
                        {plan.price}
                      </span>
                      <span className="text-sm ml-0.5" style={{ color: isHighlight ? (isDark ? "rgba(10,10,10,0.5)" : "rgba(242,242,242,0.5)") : fgMuted }}>
                        ,00
                      </span>
                    </div>
                    <p
                      className="text-xs mt-1"
                      style={{ color: isHighlight ? (isDark ? "rgba(10,10,10,0.5)" : "rgba(242,242,242,0.5)") : fgMuted }}
                    >
                      {plan.priceNote}
                    </p>
                    {plan.id === "enterprise" && (
                      <p className="text-xs font-semibold mt-0.5" style={{ color: isHighlight ? (isDark ? "rgba(10,10,10,0.6)" : "#16a34a") : "#16a34a" }}>
                        Equivale a R$ 23,33/mês · Economia de R$ 80
                      </p>
                    )}
                  </div>

                  <div
                    className="my-4 h-px"
                    style={{ backgroundColor: isHighlight ? (isDark ? "rgba(10,10,10,0.15)" : "rgba(242,242,242,0.2)") : cardBorder }}
                  />

                  <p
                    className="text-sm leading-relaxed mb-6 flex-1"
                    style={{ color: isHighlight ? (isDark ? "rgba(10,10,10,0.55)" : "rgba(242,242,242,0.65)") : fgMuted }}
                  >
                    {plan.desc}
                  </p>

                  <Link
                    href={plan.ctaHref}
                    className="w-full h-11 rounded-full text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: isHighlight ? cardDarkFg : cardDark,
                      color: isHighlight ? cardDark : cardDarkFg,
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

        {/* ── Tabela comparativa completa ── */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)" }}
            >
              Comparativo
            </p>
            <h2
              className="text-[clamp(2rem,5vw,3rem)] font-black tracking-tighter leading-tight"
              style={{
                color: fg,
                fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
              }}
            >
              O que cada plano inclui.
            </h2>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${cardBorder}` }}
          >
            {/* Header da tabela */}
            <div
              className="grid grid-cols-4"
              style={{ backgroundColor: isDark ? "#0f0f0f" : "#f3f3f3", borderBottom: `1px solid ${cardBorder}` }}
            >
              <div
                className="p-5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)" }}
              >
                Funcionalidade
              </div>
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="p-5 text-center relative"
                  style={{
                    backgroundColor: p.highlight ? cardDark : undefined,
                  }}
                >
                  <p
                    className="text-sm font-black tracking-tight"
                    style={{
                      color: p.highlight ? cardDarkFg : fg,
                      fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
                    }}
                  >
                    {p.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: p.highlight ? (isDark ? "rgba(10,10,10,0.5)" : "rgba(242,242,242,0.5)") : fgMuted }}
                  >
                    R$ {p.price}
                  </p>
                </div>
              ))}
            </div>

            {featureGroups.map((group) => {
              const GroupIcon = group.icon
              return (
                <div key={group.label}>
                  {/* Separador de categoria */}
                  <div
                    className="grid grid-cols-4 px-5 py-3"
                    style={{
                      backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                      borderBottom: `1px solid ${cardBorder}`,
                    }}
                  >
                    <div className="col-span-4 flex items-center gap-2">
                      <GroupIcon className="size-3.5" style={{ color: fgMuted }} />
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: fgMuted }}
                      >
                        {group.label}
                      </span>
                    </div>
                  </div>

                  {group.rows.map((row, i) => (
                    <div
                      key={row.name}
                      className="grid grid-cols-4"
                      style={{
                        backgroundColor: i % 2 === 0
                          ? (isDark ? "transparent" : "transparent")
                          : (isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)"),
                        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                      }}
                    >
                      <div
                        className="px-5 py-3.5 text-sm flex items-center"
                        style={{ color: isDark ? "rgba(242,242,242,0.7)" : "rgba(10,10,10,0.7)" }}
                      >
                        {row.name}
                      </div>
                      {(["start", "business", "enterprise"] as const).map((planId, idx) => {
                        const plan = plans[idx]
                        return (
                          <div
                            key={planId}
                            className="px-5 py-3.5 flex items-center justify-center"
                            style={{
                              backgroundColor: idx === 1 ? cardDark : undefined,
                            }}
                          >
                            <CellIcon
                              value={row[planId] as boolean | string}
                              isHighlight={idx === 1}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )
            })}

            {/* Rodapé da tabela com CTAs */}
            <div
              className="grid grid-cols-4"
              style={{ backgroundColor: isDark ? "#0f0f0f" : "#f3f3f3", borderTop: `1px solid ${cardBorder}` }}
            >
              <div className="p-5" />
              {plans.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-4 flex items-center justify-center"
                  style={{ backgroundColor: p.highlight ? cardDark : undefined }}
                >
                  <Link
                    href={p.ctaHref}
                    className="text-xs font-bold px-5 py-2.5 rounded-full transition-all"
                    style={{
                      backgroundColor: p.highlight ? cardDarkFg : cardDark,
                      color: p.highlight ? cardDark : cardDarkFg,
                    }}
                  >
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Garantias ── */}
        <section className="mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "Sem cobrança automática",
                desc: "Nenhuma assinatura recorrente. Você escolhe quando e se renova.",
              },
              {
                icon: Sparkles,
                title: "Ativação instantânea",
                desc: "Sua licença é ativada automaticamente após confirmação do pagamento.",
              },
              {
                icon: Star,
                title: "Suporte humano",
                desc: "Atendimento real via ticket ou WhatsApp. Sem bots, sem fila automática.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 p-5 rounded-2xl border transition-all"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <div
                  className="size-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                >
                  <Icon className="size-4" style={{ color: fg }} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: fg }}>{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: fgMuted }}>{desc}</p>
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
              style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)" }}
            >
              FAQ
            </p>
            <h2
              className="text-[clamp(1.8rem,4vw,2.8rem)] font-black tracking-tighter"
              style={{
                color: fg,
                fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
              }}
            >
              Perguntas frequentes.
            </h2>
          </div>

          <div
            className="max-w-2xl mx-auto rounded-2xl border px-6"
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
            className="relative rounded-2xl overflow-hidden p-12"
            style={{ backgroundColor: cardDark }}
          >
            {/* Dots pattern no CTA */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: isDark
                  ? "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)"
                  : "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative z-10">
              <h2
                className="text-[clamp(2rem,5vw,3.2rem)] font-black tracking-tighter leading-tight text-balance mb-4"
                style={{
                  color: cardDarkFg,
                  fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
                }}
              >
                Pronto para começar?
              </h2>
              <p
                className="text-sm mb-8 max-w-sm mx-auto leading-relaxed"
                style={{ color: isDark ? "rgba(10,10,10,0.55)" : "rgba(242,242,242,0.6)" }}
              >
                Crie sua conta gratuitamente e escolha o plano dentro do sistema.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/sign-up"
                  className="h-12 px-8 rounded-full text-sm font-bold flex items-center gap-2 transition-all hover:opacity-85"
                  style={{ backgroundColor: cardDarkFg, color: cardDark }}
                >
                  Criar conta grátis
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/sign-in"
                  className="h-12 px-8 rounded-full border text-sm font-medium flex items-center gap-2 transition-all hover:opacity-70"
                  style={{
                    borderColor: isDark ? "rgba(10,10,10,0.3)" : "rgba(242,242,242,0.3)",
                    color: isDark ? "rgba(10,10,10,0.6)" : "rgba(242,242,242,0.7)",
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
        style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)" }}
      >
        <div
          className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <Image src="/elevanthe-icon.png" alt="" width={20} height={20} className="object-contain opacity-60" />
            <span
              className="text-xs font-semibold"
              style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)" }}
            >
              &copy; {new Date().getFullYear()} Elevanthe. Todos os direitos reservados.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-xs transition-colors"
              style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)" }}
            >
              Entrar
            </Link>
            <Link
              href="/sign-up"
              className="text-xs transition-colors"
              style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)" }}
            >
              Criar conta
            </Link>
            <Link
              href="/demo"
              className="text-xs transition-colors"
              style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)" }}
            >
              Demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

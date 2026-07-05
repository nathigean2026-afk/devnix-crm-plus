"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Check, Zap, CalendarDays, CalendarRange,
  LogOut, Loader2, ShieldCheck, Lock, Sparkles,
  Gift, ArrowRight, CheckCircle2, Sun, Moon,
  Bolt, BadgeCheck, X,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { redeemPromoCode } from "@/lib/actions"

interface PlanosViewProps {
  user: { name: string; email: string }
  isRenovar?: boolean
}

const plans = [
  {
    id: "7d" as const,
    label: "Start",
    tagline: "7 dias de acesso",
    price: 7,
    priceNote: "pagamento único",
    description: "Experimente a plataforma inteira sem restrições. Ideal para conhecer o sistema antes de escolher um plano maior.",
    icon: Zap,
    features: [
      "Clientes, OS e orçamentos ilimitados",
      "Financeiro completo",
      "Catálogo de serviços",
      "Link público de orçamento",
      "Relatórios e gráficos",
      "Suporte por e-mail",
    ],
    lockedFeatures: [
      "Logo e marca nos documentos",
      "Notificações de resposta de orçamento",
      "Funcionário auxiliar",
    ],
    highlight: false,
    badge: null as string | null,
    savings: null as string | null,
  },
  {
    id: "30d" as const,
    label: "Business",
    tagline: "30 dias de acesso",
    price: 30,
    priceNote: "por mês",
    description: "Para profissionais que querem apresentar uma marca profissional nos documentos e receber notificações em tempo real.",
    icon: CalendarDays,
    features: [
      "Tudo do plano Start",
      "Logo e nome da empresa nos PDFs",
      "CNPJ no cabeçalho dos documentos",
      "Cor de destaque personalizada",
      "Notificações de resposta de orçamento",
      "Suporte prioritário",
    ],
    lockedFeatures: [] as string[],
    highlight: true,
    badge: "Mais popular",
    savings: null,
  },
  {
    id: "1y" as const,
    label: "Enterprise",
    tagline: "360 dias de acesso",
    price: 280,
    priceNote: "por ano",
    description: "Melhor custo-benefício com todos os recursos e 1 funcionário auxiliar incluso com permissões individuais.",
    icon: CalendarRange,
    features: [
      "Tudo do plano Business",
      "360 dias de acesso completo",
      "1 funcionário auxiliar incluso",
      "Permissões por módulo por usuário",
      "Suporte VIP dedicado",
    ],
    lockedFeatures: [] as string[],
    highlight: false,
    badge: "Melhor valor",
    savings: "Equivale a R$ 23,33/mês — economia de R$ 80",
  },
]

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

// Logo oficial do Mercado Pago servido localmente
function MpLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/mercadopago-logo.png"
      alt="Mercado Pago"
      width={16}
      height={16}
      className={cn("object-contain", className)}
    />
  )
}

export function PlanosView({ user, isRenovar = false }: PlanosViewProps) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isDark = !mounted ? true : resolvedTheme === "dark"

  const bg          = isDark ? "#080808" : "#f8f8f8"
  const fg          = isDark ? "#f2f2f2" : "#0a0a0a"
  const fgMuted     = isDark ? "rgba(242,242,242,0.42)" : "rgba(10,10,10,0.42)"
  const fgSub       = isDark ? "rgba(242,242,242,0.28)" : "rgba(10,10,10,0.28)"
  const cardBg      = isDark ? "#111111" : "#ffffff"
  const cardBorder  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"
  const highlightBg = isDark ? "#f2f2f2" : "#0a0a0a"
  const highlightFg = isDark ? "#0a0a0a" : "#f2f2f2"

  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  // Código promocional
  const [showPromo, setShowPromo] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoActivated, setPromoActivated] = useState<{ durationMinutes: number; planName: string } | null>(null)
  const [promoAlreadyUsed, setPromoAlreadyUsed] = useState(false)

  function formatDurationLabel(minutes: number): string {
    if (minutes < 60) return `${minutes} minutos`
    const h = Math.floor(minutes / 60)
    if (h < 24) return `${h} hora${h > 1 ? "s" : ""}`
    const d = Math.floor(h / 24)
    const rem = h % 24
    return rem > 0 ? `${d} dia${d > 1 ? "s" : ""} e ${rem}h` : `${d} dia${d > 1 ? "s" : ""}`
  }

  async function handleRedeemPromo() {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoAlreadyUsed(false)
    try {
      const result = await redeemPromoCode(promoCode.trim())
      if (!result.success) {
        if (result.alreadyUsed) {
          setPromoAlreadyUsed(true)
        } else {
          toast.error(result.error)
        }
        return
      }
      setPromoActivated({ durationMinutes: result.durationMinutes, planName: result.planName })
      toast.success(`Codigo ativado! Acesso liberado por ${formatDurationLabel(result.durationMinutes)}.`)
      // window.location.href forca reload completo para o servidor reconhecer a nova sessao/licenca
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 2500)
    } catch {
      toast.error("Erro de conexao. Verifique sua internet e tente novamente.")
    } finally {
      setPromoLoading(false)
    }
  }

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
      if (!res.ok || data.error) {
        if (data.detail) console.error("[v0] MP Checkout detalhe:", JSON.stringify(data.detail))
        throw new Error(data.error ?? "Erro ao iniciar checkout")
      }
      if (!data.initPoint) throw new Error("URL de checkout não recebida")
      window.location.href = data.initPoint
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao abrir checkout")
      setLoadingPlanId(null)
    }
  }

  const isAnyLoading = !!loadingPlanId

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg, color: fg, fontFamily: "var(--font-geist-sans, sans-serif)" }}>

      {/* Grid pattern sutil */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
            : "linear-gradient(rgba(0,0,0,0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.065) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          backgroundColor: isDark ? "rgba(8,8,8,0.82)" : "rgba(248,248,248,0.82)",
          borderColor: cardBorder,
        }}
      >
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/elevanthe-icon.png"
              alt="Elevanthe CRM"
              width={26}
              height={26}
              className="object-contain"
            />
            <span className="font-black text-sm tracking-tight hidden sm:block" style={{ color: fg }}>
              Elevanthe CRM
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <ThemeToggleButton isDark={isDark} />
            <span
              className="hidden md:block text-xs truncate max-w-[180px]"
              style={{ color: fgMuted }}
            >
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hover:opacity-80"
              style={{ color: fgMuted, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">

        {/* Hero */}
        <div className="pt-20 pb-14 text-center">
          <div
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border mb-7"
            style={{ borderColor: cardBorder, color: fgMuted }}
          >
            <Sparkles className="size-3" />
            {isRenovar ? "Renovação de licença" : "Planos e preços"}
          </div>

          <h1
            className="text-[clamp(2.8rem,8vw,5rem)] font-black tracking-tighter leading-[1.02] text-balance mb-5"
            style={{ color: fg }}
          >
            {isRenovar
              ? <>Renove seu<br className="hidden sm:block" /> acesso</>
              : <>Simples,<br className="hidden sm:block" /> sem surpresas.</>
            }
          </h1>
          <p className="text-base max-w-xl mx-auto leading-relaxed mb-6" style={{ color: fgMuted }}>
            Pague uma vez, use o tempo inteiro. Sem assinatura automática, sem renovação forçada.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs" style={{ color: fgSub }}>
            <span className="flex items-center gap-1.5"><Lock className="size-3" />Pagamento via Pix</span>
            <span className="size-1 rounded-full" style={{ backgroundColor: fgSub }} />
            <span className="flex items-center gap-1.5"><Bolt className="size-3" />Ativação instantânea</span>
            <span className="size-1 rounded-full" style={{ backgroundColor: fgSub }} />
            <span className="flex items-center gap-1.5"><BadgeCheck className="size-3" />Sem renovação automática</span>
          </div>
        </div>

        {/* Cards de planos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isH = plan.highlight
            const isLoading = loadingPlanId === plan.id

            return (
              <div
                key={plan.id}
                className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  backgroundColor: isH ? highlightBg : cardBg,
                  border: `1px solid ${isH ? highlightBg : cardBorder}`,
                  transform: isH ? "scale(1.025)" : undefined,
                  boxShadow: isH
                    ? isDark
                      ? "0 0 0 1px rgba(255,255,255,0.12), 0 20px 60px rgba(0,0,0,0.5)"
                      : "0 0 0 1px rgba(0,0,0,0.2), 0 20px 60px rgba(0,0,0,0.15)"
                    : undefined,
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

                {/* Badge topo */}
                {plan.badge && (
                  <div
                    className="flex items-center justify-center py-1.5 border-b text-[11px] font-bold tracking-wide uppercase"
                    style={{
                      backgroundColor: isH
                        ? isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
                        : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                      borderColor: isH
                        ? isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
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
                        {plan.label}
                      </h2>
                      <p className="text-xs" style={{ color: isH ? (isDark ? "rgba(10,10,10,0.5)" : "rgba(242,242,242,0.5)") : fgMuted }}>
                        {plan.tagline}
                      </p>
                    </div>
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isH
                          ? isDark ? "rgba(10,10,10,0.12)" : "rgba(242,242,242,0.15)"
                          : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                        color: isH ? highlightFg : fgMuted,
                      }}
                    >
                      <Icon className="size-4.5" />
                    </div>
                  </div>

                  {/* Preco */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-medium" style={{ color: isH ? (isDark ? "rgba(10,10,10,0.5)" : "rgba(242,242,242,0.5)") : fgMuted }}>R$</span>
                      <span
                        className="text-[52px] font-black tracking-tighter leading-none"
                        style={{ color: isH ? highlightFg : fg }}
                      >
                        {plan.price}
                      </span>
                      <span className="text-sm font-medium" style={{ color: isH ? (isDark ? "rgba(10,10,10,0.5)" : "rgba(242,242,242,0.5)") : fgMuted }}>,00</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: isH ? (isDark ? "rgba(10,10,10,0.45)" : "rgba(242,242,242,0.45)") : fgMuted }}>
                      {plan.priceNote}
                    </p>
                    {plan.savings && (
                      <p className="text-xs font-semibold mt-1.5" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>
                        {plan.savings}
                      </p>
                    )}
                  </div>

                  {/* Separador */}
                  <div className="mb-5 h-px" style={{ backgroundColor: isH ? (isDark ? "rgba(10,10,10,0.12)" : "rgba(242,242,242,0.15)") : cardBorder }} />

                  {/* Descricao */}
                  <p className="text-sm leading-relaxed text-pretty mb-5" style={{ color: isH ? (isDark ? "rgba(10,10,10,0.55)" : "rgba(242,242,242,0.55)") : fgMuted }}>
                    {plan.description}
                  </p>

                  {/* Features */}
                  <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <div
                          className="size-4 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isH
                              ? isDark ? "rgba(10,10,10,0.15)" : "rgba(242,242,242,0.18)"
                              : isDark ? "rgba(34,197,94,0.15)" : "rgba(22,163,74,0.1)",
                          }}
                        >
                          <Check
                            className="size-2.5"
                            strokeWidth={3}
                            style={{ color: isH ? highlightFg : (isDark ? "#4ade80" : "#16a34a") }}
                          />
                        </div>
                        <span style={{ color: isH ? (isDark ? "rgba(10,10,10,0.8)" : "rgba(242,242,242,0.8)") : (isDark ? "rgba(242,242,242,0.75)" : "rgba(10,10,10,0.75)") }}>
                          {f}
                        </span>
                      </li>
                    ))}
                    {plan.lockedFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm opacity-35">
                        <div
                          className="size-4 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                        >
                          <X className="size-2.5" strokeWidth={2.5} style={{ color: fgMuted }} />
                        </div>
                        <span className="line-through" style={{ color: fgMuted }}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={isAnyLoading}
                    className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: isH ? cardBg : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                      color: isH ? fg : (isDark ? fg : fg),
                      border: isH ? "none" : `1px solid ${cardBorder}`,
                    }}
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

        {/* Código Promocional */}
        <div className="pb-12 flex flex-col items-center">
          {!showPromo && !promoActivated && (
            <button
              onClick={() => setShowPromo(true)}
              className="flex items-center gap-2 text-sm transition-all hover:opacity-80"
              style={{ color: fgMuted }}
            >
              <Gift className="size-4" />
              Tenho um código promocional
            </button>
          )}

          {showPromo && !promoActivated && (
            <div
              className="w-full max-w-sm rounded-2xl p-6 text-center"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <div
                className="size-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
              >
                <Gift className="size-5" style={{ color: fgMuted }} />
              </div>
              <h3 className="font-bold mb-1" style={{ color: fg }}>Código Promocional</h3>
              <p className="text-sm mb-5" style={{ color: fgMuted }}>
                Insira seu código de teste para ativar o acesso gratuito.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: TESTE2024"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) handleRedeemPromo()
                  }}
                  disabled={promoLoading}
                  className="flex-1 h-10 rounded-lg px-3 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${cardBorder}`,
                    color: fg,
                  }}
                />
                <button
                  onClick={handleRedeemPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="h-10 px-4 rounded-lg text-sm font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-85"
                  style={{ backgroundColor: highlightBg, color: highlightFg }}
                >
                  {promoLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                </button>
              </div>
              <button
                onClick={() => setShowPromo(false)}
                className="mt-3 text-xs transition-opacity hover:opacity-70"
                style={{ color: fgSub }}
              >
                Cancelar
              </button>
            </div>
          )}

          {promoAlreadyUsed && !promoActivated && (
            <div
              className="w-full max-w-sm rounded-2xl p-6 text-center"
              style={{
                backgroundColor: isDark ? "rgba(239,68,68,0.07)" : "#fef2f2",
                border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.25)"}`,
              }}
            >
              <div className="size-10 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "#fee2e2" }}>
                <X className="size-5" style={{ color: isDark ? "#f87171" : "#dc2626" }} />
              </div>
              <h3 className="font-bold mb-1" style={{ color: isDark ? "#f87171" : "#dc2626" }}>Codigo ja utilizado</h3>
              <p className="text-sm mb-4" style={{ color: isDark ? "#fca5a5" : "#991b1b" }}>
                Este codigo promocional ja foi resgatado e nao pode ser usado novamente.
              </p>
              <button
                onClick={() => { setPromoAlreadyUsed(false); setPromoCode("") }}
                className="text-xs underline transition-opacity hover:opacity-70"
                style={{ color: isDark ? "#fca5a5" : "#991b1b" }}
              >
                Tentar outro codigo
              </button>
            </div>
          )}

          {promoActivated && (
            <div
              className="w-full max-w-sm rounded-2xl p-6 text-center"
              style={{
                backgroundColor: isDark ? "rgba(22,163,74,0.08)" : "#f0fdf4",
                border: `1px solid ${isDark ? "rgba(22,163,74,0.2)" : "rgba(22,163,74,0.25)"}`,
              }}
            >
              <div className="size-10 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7" }}>
                <CheckCircle2 className="size-5" style={{ color: isDark ? "#4ade80" : "#16a34a" }} />
              </div>
              <h3 className="font-bold mb-1" style={{ color: isDark ? "#4ade80" : "#15803d" }}>Codigo Ativado!</h3>
              <p className="text-sm mb-1" style={{ color: isDark ? "#86efac" : "#166534" }}>
                Plano <strong>{promoActivated.planName}</strong> ativado com sucesso.
              </p>
              <p className="text-sm font-semibold mb-4" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>
                {formatDurationLabel(promoActivated.durationMinutes)} de acesso liberados.
              </p>
              <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: isDark ? "#86efac" : "#166534" }}>
                <Loader2 className="size-3 animate-spin" />
                Redirecionando para o dashboard...
              </p>
            </div>
          )}
        </div>

        {/* Garantias */}
        <div
          className="border-t py-12 grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10"
          style={{ borderColor: cardBorder }}
        >
          {[
            {
              icon: ShieldCheck,
              title: "Sem cobrança automática",
              desc: "Nenhuma assinatura recorrente. Você renova apenas quando quiser.",
            },
            {
              icon: Sparkles,
              title: "Ativação instantânea",
              desc: "Licença ativada automaticamente após confirmação do pagamento.",
            },
            {
              icon: Lock,
              title: "Pagamento 100% seguro",
              desc: "Processado pelo Mercado Pago. Aceita Pix, cartão e boleto.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3.5">
              <div
                className="size-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
              >
                <Icon className="size-4" style={{ color: fgMuted }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: fg }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: fgMuted }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}

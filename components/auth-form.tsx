"use client"

import { WhatsAppButton } from "@/components/support/whatsapp-button"
import { IntroVideoOverlay } from "@/components/intro-video-overlay"
import { PricingCards } from "@/components/pricing-cards"
import { authClient } from "@/lib/auth-client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import {
  Eye, EyeOff, ArrowRight, Lock, Mail, User,
  Sun, Moon,
  Users, FileText, BarChart2, DollarSign, ClipboardList,
  Settings, Wrench, Bell, QrCode, Package, Zap,
  TrendingUp, ShieldCheck, Globe, Send, Layers, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthFormProps {
  mode: "sign-in" | "sign-up"
  kicked?: boolean
}

// ─── Funcionalidades do CRM para marca d'água ─────────────────────────────────
const crmFeatures = [
  { icon: Users,        label: "Gestão de Clientes" },
  { icon: FileText,     label: "Orçamentos" },
  { icon: ClipboardList,label: "Ordens de Serviço" },
  { icon: DollarSign,   label: "Financeiro" },
  { icon: BarChart2,    label: "Relatórios" },
  { icon: Wrench,       label: "Catálogo de Serviços" },
  { icon: QrCode,       label: "Pagamento via Pix" },
  { icon: Send,         label: "Envio por WhatsApp" },
  { icon: Bell,         label: "Notificações" },
  { icon: Package,      label: "Controle de Estoque" },
  { icon: TrendingUp,   label: "Métricas de Receita" },
  { icon: ShieldCheck,  label: "Acesso por Funcionário" },
  { icon: Globe,        label: "Link de Orçamento Público" },
  { icon: Layers,       label: "Multi-empresa" },
  { icon: Zap,          label: "Dashboard em Tempo Real" },
  { icon: Star,         label: "Histórico do Cliente" },
  { icon: Settings,     label: "Personalização de Tema" },
  { icon: Globe,        label: "Assinatura Digital" },
]

// ─── Carrossel de screenshots ─────────────────────────────────────────────────
const slides = [
  { src: "/screenshots/dashboard.png",  label: "Dashboard",  desc: "Visão geral do seu negócio em tempo real" },
  { src: "/screenshots/clientes.png",   label: "Clientes",   desc: "Gerencie sua base de clientes com facilidade" },
  { src: "/screenshots/orcamentos.png", label: "Orçamentos", desc: "Crie e envie orçamentos profissionais" },
  { src: "/screenshots/financeiro.png", label: "Financeiro", desc: "Controle receitas, despesas e saldo" },
  { src: "/screenshots/relatorios.png", label: "Relatórios", desc: "Análises e métricas do seu negócio" },
]

function ScreenshotCarousel() {
  const [active, setActive] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setActive((prev) => (prev + 1) % slides.length)
        setAnimating(false)
      }, 400)
    }, 3800)
    return () => clearInterval(timer)
  }, [])

  const goTo = (idx: number) => {
    if (idx === active) return
    setAnimating(true)
    setTimeout(() => { setActive(idx); setAnimating(false) }, 300)
  }

  const current = slides[active]

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/70 bg-[#0d0d14]">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-red-500/40" />
            <div className="size-2.5 rounded-full bg-yellow-500/40" />
            <div className="size-2.5 rounded-full bg-green-500/40" />
          </div>
          <div className="flex-1 mx-2 h-5 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center px-2">
            <span className="text-[10px] text-white/20 truncate">
              app.elevanthe.com.br/{current.label.toLowerCase()}
            </span>
          </div>
        </div>
        <div className={cn("transition-opacity duration-300", animating ? "opacity-0" : "opacity-100")}>
          <Image
            src={current.src}
            alt={`${current.label} — Elevanthe CRM`}
            width={480}
            height={300}
            className="w-full h-auto object-cover object-top"
            priority
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <div className={cn("transition-all duration-300", animating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0")}>
          <p className="text-xs font-semibold text-white/60">{current.label}</p>
          <p className="text-[11px] text-white/25">{current.desc}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === active ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
              )}
              aria-label={`Ver ${slides[i].label}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Wallpaper de funcionalidades — posicionamento pseudo-aleatório estável ────
// Usa um gerador linear congruencial seeded para que o layout seja idêntico
// no server e no client (sem Math.random() no render).
function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function FeatureWallpaper({ isDark }: { isDark: boolean }) {
  // Repete as features para cobrir toda a tela (54 pills)
  const items = [
    ...crmFeatures, ...crmFeatures, ...crmFeatures,
  ]

  const rand = seededRand(42)

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {items.map((feat, i) => {
        const Icon = feat.icon
        // Distribui de forma pseudo-aleatória por toda a área visível
        const top  = rand() * 92   // 0–92%
        const left = rand() * 88   // 0–88%
        // Pequenas variações de rotação para parecer orgânico
        const rotate = (rand() - 0.5) * 14 // -7° a +7°
        // Opacidade levemente variada — mais forte no light para compensar o fundo claro
        const opacityDark = 0.04 + rand() * 0.045
        const opacityLight = 0.10 + rand() * 0.08
        const opacity = isDark ? opacityDark : opacityLight

        return (
          <div
            key={i}
            className={cn(
              "absolute flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium whitespace-nowrap",
              isDark ? "border-white/25 text-white" : "border-primary/30 text-primary/80 bg-primary/5"
            )}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              transform: `rotate(${rotate}deg)`,
              opacity,
            }}
          >
            <Icon className="size-3 shrink-0" />
            <span>{feat.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Botão de alternância de tema ─────────────────────────────────────────────
function ThemeToggleButton() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="size-8" />

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "size-8 rounded-lg flex items-center justify-center transition-all duration-200",
        "border hover:scale-105",
        isDark
          ? "border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white/80 hover:bg-white/[0.08]"
          : "border-black/[0.08] bg-black/[0.03] text-black/40 hover:text-black/70 hover:bg-black/[0.06]"
      )}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}

// ─── Logo responsiva ao tema ──────────────────────────────────────────────────
function ThemedLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className={cn("opacity-0", className)} style={{ height: 40, width: 200 }} />

  const isDark = resolvedTheme === "dark"

  return (
    <Image
      src={isDark ? "/elevanthe-logo-transparent-dark.png" : "/elevanthe-logo-transparent-light.png"}
      alt="Elevanthe CRM — Gestão de relacionamento que eleva resultados"
      width={260}
      height={65}
      className={cn("object-contain", className)}
      priority
    />
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function AuthForm({ mode, kicked }: AuthFormProps) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const isSignIn = mode === "sign-in"
  const isDark = !mounted || resolvedTheme === "dark"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!isSignIn) {
        const { error } = await authClient.signUp.email({
          name: form.name,
          email: form.email,
          password: form.password,
        })
        if (error) throw new Error(error.message)
        toast.success("Conta criada! Escolha seu plano para continuar.")
        router.push("/planos")
        router.refresh()
        return
      } else {
        const { error } = await authClient.signIn.email({
          email: form.email,
          password: form.password,
          rememberMe: true,
        })
        if (error) throw new Error(error.message)
        toast.success("Bem-vindo de volta!")
        await authClient.revokeOtherSessions().catch(() => {})
      }
      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ocorreu um erro. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("min-h-screen flex", isDark ? "bg-[#0a0a10]" : "bg-[#eef2fa]")}>

      {/* ─── Painel esquerdo — branding (desktop only) ─── */}
      <aside className={cn(
        "hidden lg:flex lg:w-[520px] xl:w-[560px] flex-col justify-between px-10 py-8 relative overflow-hidden flex-shrink-0 border-r",
        isDark ? "bg-[#07070d] border-white/[0.05]" : "bg-[#0f1729] border-[#1a2845]"
      )}>

        {/* Marca d'agua do elefante neon — watermark sutil */}
        <div className="absolute -bottom-16 -right-16 opacity-[0.04] pointer-events-none select-none">
          <Image src="/elevanthe-logo-neon.png" alt="" width={420} height={420} className="object-contain" />
        </div>

        {/* Glow de fundo */}
        <div className="absolute top-0 left-0 w-full h-64 pointer-events-none bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="absolute -bottom-32 -left-32 size-[400px] rounded-full blur-[100px] pointer-events-none bg-blue-600/10" />

        {/* Logo */}
        <div className="relative z-10">
          <ThemedLogo className="h-11 w-auto" />
        </div>

        {/* Conteudo central */}
        <div className="relative z-10 flex flex-col gap-8">
          <div className="space-y-3">
            <div className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 border",
              isDark ? "bg-primary/10 border-primary/20" : "bg-primary/8 border-primary/15"
            )}>
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary tracking-wide">Plataforma completa de gestão</span>
            </div>
            <h2 className="text-2xl xl:text-3xl font-black leading-[1.2] tracking-tight text-balance text-white">
              Gerencie seu negócio com clareza e velocidade
            </h2>
            <p className={cn("text-sm leading-relaxed", isDark ? "text-white/35" : "text-white/50")}>
              Do primeiro contato ao pagamento — tudo em um só lugar. Sem planilhas, sem confusão.
            </p>
          </div>

          <ScreenshotCarousel />
        </div>

        {/* Rodape */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[11px] text-white/20">
            &copy; {new Date().getFullYear()} Elevanthe. Todos os direitos reservados.
          </p>
          <p className="text-[11px] text-white/20">Pix · Cartão · Boleto</p>
        </div>
      </aside>

      {/* ─── Painel direito — formulário ─── */}
      <div className={cn("flex-1 flex flex-col min-h-screen relative overflow-hidden", isDark ? "bg-[#0a0a10]" : "bg-[#eef2fa]")}>

        {/* Wallpaper de funcionalidades — marca d'água repetida */}
        <FeatureWallpaper isDark={isDark} />

        {/* Orbs de glow — mais intensos no light para compensar o fundo claro */}
        <div className={cn("absolute -top-40 -right-40 size-[600px] rounded-full blur-[130px] pointer-events-none", isDark ? "bg-primary/12" : "bg-primary/20")} />
        <div className={cn("absolute -bottom-32 -left-32 size-[500px] rounded-full blur-[110px] pointer-events-none", isDark ? "bg-violet-600/8" : "bg-violet-500/15")} />
        <div className={cn("absolute top-1/3 left-1/2 -translate-x-1/2 size-[400px] rounded-full blur-[100px] pointer-events-none", isDark ? "bg-cyan-500/4" : "bg-sky-400/10")} />

        {/* Top bar */}
        <div className={cn("relative z-10 flex items-center justify-between px-6 py-4 border-b", isDark ? "border-white/[0.05]" : "border-slate-200/80")}>
          {/* Logo mobile */}
          <div className="lg:hidden">
            <ThemedLogo className="h-8 w-auto" />
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <Link
              href={isSignIn ? "/sign-up" : "/sign-in"}
              className={cn(
                "text-xs transition-colors border rounded-lg px-3 py-1.5",
                isDark
                  ? "text-white/40 hover:text-white/70 border-white/[0.08] hover:border-white/20"
                  : "text-slate-500 hover:text-slate-800 border-slate-200 hover:border-slate-300"
              )}
            >
              {isSignIn ? "Criar conta grátis" : "Já tenho conta"}
            </Link>
          </div>
        </div>

        {/* Form centralizado */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
          <div className={cn(
            "w-full max-w-[420px] rounded-2xl border shadow-2xl px-8 py-9 relative",
            isDark
              ? "border-white/[0.08] bg-white/[0.025] backdrop-blur-md shadow-black/70"
              : "border-white/60 bg-white/90 backdrop-blur-md shadow-blue-200/60"
          )}>
            {/* Linha de brilho no topo do card */}
            <div className={cn(
              "absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent to-transparent",
              isDark ? "via-primary/40" : "via-primary/30"
            )} />

            {/* Header do form */}
            <div className="mb-8">
              <h1 className={cn("text-[1.75rem] font-black tracking-tight leading-tight", isDark ? "text-white" : "text-slate-900")}>
                {isSignIn ? "Entrar na conta" : "Criar conta grátis"}
              </h1>
              <p className={cn("text-sm mt-2 leading-relaxed", isDark ? "text-white/35" : "text-slate-500")}>
                {isSignIn
                  ? "Acesse seu CRM e continue de onde parou."
                  : "Comece grátis, sem cartão. Escolha o plano depois."}
              </p>
            </div>

            {/* Banner sessao encerrada */}
            {kicked && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3.5">
                <Lock className="size-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">Sessão encerrada</p>
                  <p className="text-xs text-amber-400/70 mt-0.5 leading-relaxed">
                    Sua conta foi acessada em outro dispositivo. Por segurança, esta sessão foi encerrada.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSignIn && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className={cn("text-sm font-medium", isDark ? "text-white/60" : "text-slate-600")}>
                    Nome completo
                  </Label>
                  <div className="relative">
                    <User className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 size-4", isDark ? "text-white/25" : "text-slate-400")} />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className={cn(
                        "pl-10 h-11 rounded-xl",
                        isDark
                          ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-primary/60 focus-visible:border-primary/40"
                          : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary/40 focus-visible:border-primary/50"
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className={cn("text-sm font-medium", isDark ? "text-white/60" : "text-slate-600")}>
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 size-4", isDark ? "text-white/25" : "text-slate-400")} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className={cn(
                      "pl-10 h-11 rounded-xl",
                      isDark
                        ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-primary/60 focus-visible:border-primary/40"
                        : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary/40 focus-visible:border-primary/50"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className={cn("text-sm font-medium", isDark ? "text-white/60" : "text-slate-600")}>
                    Senha
                  </Label>
                  {isSignIn && (
                    <Link href="/esqueci-senha" className="text-xs text-primary/70 hover:text-primary transition-colors">
                      Esqueci a senha
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 size-4", isDark ? "text-white/25" : "text-slate-400")} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignIn ? "Sua senha" : "Mínimo 8 caracteres"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                    className={cn(
                      "pl-10 pr-11 h-11 rounded-xl",
                      isDark
                        ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-primary/60 focus-visible:border-primary/40"
                        : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary/40 focus-visible:border-primary/50"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      "absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors",
                      isDark ? "text-white/25 hover:text-white/60" : "text-slate-400 hover:text-slate-600"
                    )}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 mt-2 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Aguarde...
                  </span>
                ) : (
                  <>
                    {isSignIn ? "Entrar" : "Criar conta"}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            <p className={cn("mt-6 text-center text-sm", isDark ? "text-white/30" : "text-slate-500")}>
              {isSignIn ? (
                <>
                  Não tem conta?{" "}
                  <Link href="/sign-up" className="text-primary/80 hover:text-primary transition-colors font-semibold">
                    Criar conta grátis
                  </Link>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <Link href="/sign-in" className="text-primary/80 hover:text-primary transition-colors font-semibold">
                    Entrar
                  </Link>
                </>
              )}
            </p>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setShowIntro(true)}
                className={cn(
                  "text-xs transition-colors inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer",
                  isDark ? "text-white/20 hover:text-white/40" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Ver demonstração sem cadastro
                <ArrowRight className="size-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Cards de planos — visíveis abaixo do formulário */}
        <div className="relative z-10 w-full">
          <PricingCards isDark={isDark} />
        </div>
      </div>

      <WhatsAppButton />

      {showIntro && (
        <IntroVideoOverlay
          onEnd={() => {
            setShowIntro(false)
            router.push("/demo")
          }}
        />
      )}
    </div>
  )
}

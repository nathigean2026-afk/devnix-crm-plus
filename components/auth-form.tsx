"use client"

import { WhatsAppButton } from "@/components/support/whatsapp-button"
import { IntroVideoOverlay } from "@/components/intro-video-overlay"
import { useTurnstile } from "@/hooks/use-turnstile"
import { authClient } from "@/lib/auth-client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScreenshotCarousel } from "@/components/screenshot-carousel"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Mail,
  User,
  Sun,
  Moon,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Turnstile carregado de forma lazy — o script Cloudflare não bloqueia FCP/LCP
const TurnstileWidget = dynamic(
  () => import("@/components/turnstile-widget").then((m) => ({ default: m.TurnstileWidget })),
  { ssr: false, loading: () => <div className="h-[65px]" aria-hidden /> }
)

import type { TurnstileWidgetRef } from "@/components/turnstile-widget"

interface AuthFormProps {
  mode: "sign-in" | "sign-up"
  kicked?: boolean
}

// ─── Botão de alternância de tema ─────────────────────────────────────────────
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
        "size-8 rounded-full flex items-center justify-center transition-all duration-200",
        "border hover:scale-105",
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

// ─── Logo responsiva ao tema ──────────────────────────────────────────────────
function ThemedLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className={cn("opacity-0", className)} style={{ height: 40, width: 200 }} />

  const isDark = resolvedTheme === "dark"

  return (
    <>
      {/* Desktop: logo sempre dark (aside sempre escuro) */}
      <Image
        src="/elevanthe-logo-transparent-dark.png"
        alt="Elevanthe CRM — Gestão de relacionamento que eleva resultados"
        width={220}
        height={55}
        className={cn("object-contain hidden md:block", className)}
        priority
        fetchPriority="high"
        sizes="(max-width: 767px) 1px, 220px"
      />
      {/* Mobile: alterna com o tema */}
      <Image
        src={isDark ? "/elevanthe-logo-transparent-dark.png" : "/elevanthe-logo-transparent-light.png"}
        alt="Elevanthe CRM — Gestão de relacionamento que eleva resultados"
        width={180}
        height={45}
        className={cn("object-contain block md:hidden", className)}
        loading="lazy"
        fetchPriority="low"
        sizes="(min-width: 768px) 1px, 180px"
      />
    </>
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
  const turnstileRef = useRef<TurnstileWidgetRef>(null)

  const {
    isVerified: turnstileVerified,
    isVerifying: turnstileVerifying,
    error: turnstileError,
    handleSuccess: onTurnstileSuccess,
    handleExpire: onTurnstileExpire,
    handleError: onTurnstileError,
    verifyToken,
  } = useTurnstile()

  useEffect(() => { setMounted(true) }, [])

  const isSignIn = mode === "sign-in"
  const isDark = !mounted || resolvedTheme === "dark"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const tokenValid = await verifyToken()
    if (!tokenValid) return

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
      // Reseta o widget Turnstile para o usuário não precisar recarregar a página
      reset()
      turnstileRef.current?.reset()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: isDark ? "#080808" : "#f8f8f8" }}
    >

      {/* ─── Painel esquerdo — branding (desktop only) ─── */}
      <aside
        className="hidden lg:flex lg:w-[500px] xl:w-[540px] flex-col justify-between px-12 py-10 relative overflow-hidden flex-shrink-0"
        style={{ backgroundColor: isDark ? "#0a0a0a" : "#0a0a0a", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Grid pattern de fundo (aside escuro fixo) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <ThemedLogo className="h-10 w-auto" />
        </div>

        {/* Conteudo central — tipografia massiva estilo elevanthe.com */}
        <div className="relative z-10 flex flex-col gap-10">
          <div className="space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 bg-white/5">
              <div className="size-1.5 rounded-full bg-white/60 animate-pulse" />
              <span className="text-[11px] font-semibold text-white/50 tracking-widest uppercase">
                Plataforma completa de gestão
              </span>
            </div>

            {/* Headline massiva — estilo elevanthe.com */}
            <h2
              className="text-[2.6rem] xl:text-[3.2rem] font-black leading-[1.04] tracking-tighter text-balance text-white"
              style={{ fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)" }}
            >
              Gerencie seu<br />
              negócio com<br />
              <span className="text-white/40">clareza.</span>
            </h2>
            <p className="text-sm leading-relaxed text-white/35 max-w-xs">
              Do primeiro contato ao pagamento — tudo em um só lugar. Sem planilhas, sem confusão.
            </p>
          </div>

          <ScreenshotCarousel />
        </div>

        {/* Rodapé */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[11px] text-white/15">
            &copy; {new Date().getFullYear()} Elevanthe. Todos os direitos reservados.
          </p>
          <p className="text-[11px] text-white/15">Pix · Cartão · Boleto</p>
        </div>
      </aside>

      {/* ─── Painel direito — formulário ─── */}
      <div
        className="flex-1 flex flex-col min-h-screen relative overflow-hidden"
        style={{ backgroundColor: isDark ? "#080808" : "#f8f8f8" }}
      >
        {/* Grid pattern de fundo — light: linhas cinza claras / dark: linhas escuras */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: isDark
              ? "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
              : "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Vinheta radial suave nos cantos */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 35%, rgba(8,8,8,0.85) 100%)"
              : "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 35%, rgba(248,248,248,0.85) 100%)",
          }}
        />

        {/* Marca d'agua glamourosa — elefante + wordmark centralizados atrás do form */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pointer-events-none select-none overflow-hidden">
          {/* Elefante grande com glow */}
          <div
            className="relative"
            style={{
              filter: isDark
                ? "drop-shadow(0 0 80px rgba(120,100,255,0.18)) drop-shadow(0 0 30px rgba(255,255,255,0.08))"
                : "drop-shadow(0 0 60px rgba(0,0,0,0.08))",
            }}
          >
            <Image
              src="/elevanthe-logo-neon.png"
              alt=""
              width={320}
              height={320}
              className="object-contain"
              style={{ opacity: isDark ? 0.13 : 0.08 }}
              loading="eager"
              sizes="320px"
              decoding="async"
            />
          </div>
          {/* Wordmark ELEVANTHE em tipografia massiva */}
          <div
            style={{
              fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              fontWeight: 900,
              letterSpacing: "0.22em",
              lineHeight: 1,
              opacity: isDark ? 0.1 : 0.065,
              color: isDark ? "#ffffff" : "#000000",
              userSelect: "none",
            }}
          >
            ELEVANTHE
          </div>
        </div>

        {/* Top bar */}
        <div
          className="relative z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)" }}
        >
          {/* Logo mobile */}
          <div className="lg:hidden">
            <ThemedLogo className="h-8 w-auto" />
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2.5">
            <ThemeToggleButton />
            <Link
              href={isSignIn ? "/sign-up" : "/sign-in"}
              className={cn(
                "text-xs transition-colors border rounded-full px-4 py-1.5 font-medium",
                isDark
                  ? "text-white/50 hover:text-white border-white/10 hover:border-white/25 hover:bg-white/5"
                  : "text-black/50 hover:text-black border-black/10 hover:border-black/25 hover:bg-black/5"
              )}
            >
              {isSignIn ? "Criar conta grátis" : "Já tenho conta"}
            </Link>
          </div>
        </div>

        {/* Form centralizado */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
          <div
            className="w-full max-w-[400px] rounded-2xl border shadow-xl px-8 py-9 relative"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Linha de brilho no topo do card */}
            <div
              className="absolute top-0 left-8 right-8 h-px"
              style={{
                background: isDark
                  ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)"
                  : "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)",
              }}
            />

            {/* Header do form */}
            <div className="mb-8">
              <h1
                className="text-[1.85rem] font-black tracking-tight leading-tight"
                style={{
                  color: isDark ? "#f2f2f2" : "#0a0a0a",
                  fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
                }}
              >
                {isSignIn ? "Entrar na conta" : "Criar conta grátis"}
              </h1>
              <p
                className="text-sm mt-2 leading-relaxed"
                style={{ color: isDark ? "rgba(242,242,242,0.4)" : "rgba(10,10,10,0.45)" }}
              >
                {isSignIn
                  ? "Acesse seu CRM e continue de onde parou."
                  : "Comece grátis, sem cartão. Escolha o plano depois."}
              </p>
            </div>

            {/* Banner sessão encerrada */}
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
                  <Label
                    htmlFor="name"
                    className="text-xs font-semibold tracking-wide uppercase"
                    style={{ color: isDark ? "rgba(242,242,242,0.4)" : "rgba(10,10,10,0.4)" }}
                  >
                    Nome completo
                  </Label>
                  <div className="relative">
                    <User
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5"
                      style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)" }}
                    />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className={cn(
                        "pl-10 h-11 rounded-xl text-sm",
                        isDark
                          ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-white/20 focus-visible:border-white/25"
                          : "bg-black/[0.03] border-black/[0.09] text-black placeholder:text-black/30 focus-visible:ring-black/10 focus-visible:border-black/20"
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold tracking-wide uppercase"
                  style={{ color: isDark ? "rgba(242,242,242,0.4)" : "rgba(10,10,10,0.4)" }}
                >
                  E-mail
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5"
                    style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)" }}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className={cn(
                      "pl-10 h-11 rounded-xl text-sm",
                      isDark
                        ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-white/20 focus-visible:border-white/25"
                        : "bg-black/[0.03] border-black/[0.09] text-black placeholder:text-black/30 focus-visible:ring-black/10 focus-visible:border-black/20"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold tracking-wide uppercase"
                    style={{ color: isDark ? "rgba(242,242,242,0.4)" : "rgba(10,10,10,0.4)" }}
                  >
                    Senha
                  </Label>
                  {isSignIn && (
                    <Link
                      href="/esqueci-senha"
                      className="text-xs transition-colors"
                      style={{ color: isDark ? "rgba(242,242,242,0.4)" : "rgba(10,10,10,0.4)" }}
                    >
                      Esqueci a senha
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5"
                    style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)" }}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignIn ? "Sua senha" : "Mínimo 8 caracteres"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                    className={cn(
                      "pl-10 pr-11 h-11 rounded-xl text-sm",
                      isDark
                        ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-white/20 focus-visible:border-white/25"
                        : "bg-black/[0.03] border-black/[0.09] text-black placeholder:text-black/30 focus-visible:ring-black/10 focus-visible:border-black/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)" }}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Cloudflare Turnstile */}
              <TurnstileWidget
                ref={turnstileRef}
                onSuccess={onTurnstileSuccess}
                onExpire={onTurnstileExpire}
                onError={onTurnstileError}
              />
              {turnstileError && (
                <p className="text-xs text-red-400 text-center -mt-1">{turnstileError}</p>
              )}

              {/* Botão de submit — estilo pill preto elevanthe.com */}
              <button
                type="submit"
                disabled={loading || turnstileVerifying || !turnstileVerified}
                className="w-full h-11 rounded-full text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isDark ? "#f2f2f2" : "#0a0a0a",
                  color: isDark ? "#0a0a0a" : "#f2f2f2",
                }}
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

            <p
              className="mt-6 text-center text-sm"
              style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.4)" }}
            >
              {isSignIn ? (
                <>
                  Não tem conta?{" "}
                  <Link
                    href="/sign-up"
                    className="font-semibold hover:underline transition-colors"
                    style={{ color: isDark ? "#f2f2f2" : "#0a0a0a" }}
                  >
                    Criar conta grátis
                  </Link>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <Link
                    href="/sign-in"
                    className="font-semibold hover:underline transition-colors"
                    style={{ color: isDark ? "#f2f2f2" : "#0a0a0a" }}
                  >
                    Entrar
                  </Link>
                </>
              )}
            </p>

            <div className="mt-5 text-center flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setShowIntro(true)}
                className="text-xs transition-colors inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer"
                style={{ color: isDark ? "rgba(242,242,242,0.22)" : "rgba(10,10,10,0.3)" }}
              >
                Ver demonstração sem cadastro
                <ArrowRight className="size-3" />
              </button>
              <Link
                href="/planos/publico"
                className="text-xs transition-colors inline-flex items-center gap-1.5 font-semibold hover:underline"
                style={{ color: isDark ? "rgba(242,242,242,0.45)" : "rgba(10,10,10,0.5)" }}
              >
                Ver planos e preços
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
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

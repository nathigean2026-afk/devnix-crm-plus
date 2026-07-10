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
  MessageCircle,
  ExternalLink,
  ChevronDown,
  LayoutDashboard,
  FileText,
  Headphones,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { TurnstileWidget, type TurnstileWidgetRef } from "@/components/turnstile-widget"

interface AuthFormProps {
  mode: "sign-in" | "sign-up"
  kicked?: boolean
}

// ─── Botão de login com Google ────────────────────────────────────────────────
function GoogleButton() {
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setLoading(true)
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      })
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className="w-full h-11 rounded-full text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 border border-black/[0.09] dark:border-white/[0.09] bg-white dark:bg-white/[0.04] text-black/80 dark:text-white/80 hover:bg-black/[0.03] dark:hover:bg-white/[0.07] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      {loading ? "Redirecionando..." : "Continuar com Google"}
    </button>
  )
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

  if (!mounted) return <div className={cn("opacity-0", className)} />

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
    reset: resetTurnstileState,
  } = useTurnstile()

  const isSignIn = mode === "sign-in"

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
        // Revoga outras sessões em background, sem bloquear o redirect.
        // Ignoramos erros pois o cookie pode ainda não ter sido confirmado
        // pelo browser neste ciclo de evento.
        authClient.revokeOtherSessions().catch(() => {})
        // Usa full page navigation para garantir que o cookie de sessão
        // já esteja disponível quando o servidor renderizar o dashboard.
        window.location.href = "/dashboard"
        return
      }
      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ocorreu um erro. Tente novamente.")
      resetTurnstileState()
      turnstileRef.current?.reset()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8f8f8] dark:bg-[#080808]">

      {/* ─── Painel esquerdo — branding (desktop only) ─── */}
      <aside
        className="hidden lg:flex lg:w-[500px] xl:w-[540px] flex-col justify-between px-12 py-10 relative overflow-hidden flex-shrink-0 bg-[#0a0a0a] border-r border-white/[0.06]"
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

            {/* Headline massiva */}
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
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Grid pattern de fundo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.055) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none dark:block hidden"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Vinheta radial — light */}
        <div
          className="absolute inset-0 pointer-events-none dark:hidden"
          style={{ background: "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 35%, rgba(248,248,248,0.85) 100%)" }}
        />
        {/* Vinheta radial — dark */}
        <div
          className="absolute inset-0 pointer-events-none hidden dark:block"
          style={{ background: "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 35%, rgba(8,8,8,0.85) 100%)" }}
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-black/[0.07] dark:border-white/[0.05]">
          {/* Logo mobile */}
          <div className="lg:hidden">
            <ThemedLogo className="h-8 w-auto" />
          </div>
          <div className="hidden lg:block" />

          {/* Menu de navegação */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/sign-up"
              className="text-xs font-medium transition-colors px-3 py-1.5 rounded-full text-black/55 hover:text-black hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5"
            >
              Criar conta grátis
            </Link>
            <button
              type="button"
              onClick={() => setShowIntro(true)}
              className="text-xs font-medium transition-colors px-3 py-1.5 rounded-full text-black/55 hover:text-black hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5"
            >
              Ver demonstração
            </button>
            <Link
              href="/planos/publico"
              className="text-xs font-medium transition-colors px-3 py-1.5 rounded-full text-black/55 hover:text-black hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5"
            >
              Planos e preços
            </Link>
            <Link
              href="/suporte"
              className="text-xs font-medium transition-colors px-3 py-1.5 rounded-full text-black/55 hover:text-black hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5"
            >
              Suporte
            </Link>
            <a
              href="https://wa.me/55"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium transition-colors px-3 py-1.5 rounded-full text-black/55 hover:text-black hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5 flex items-center gap-1"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </a>
            <a
              href="https://www.elevanthe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium transition-colors px-3 py-1.5 rounded-full text-black/55 hover:text-black hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5 flex items-center gap-1"
            >
              <ExternalLink className="size-3" />
              elevanthe.com
            </a>
            <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-0.5" />
            <ThemeToggleButton />
          </div>
        </div>

        {/* Form centralizado */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px] flex flex-col items-center gap-6">

            {/* Logo do elefante acima do card — dark: neon, light: colorido */}
            <div className="flex flex-col items-center select-none pointer-events-none">
              {/* Logo dark */}
              <Image
                src="/elevanthe-logo-neon.png"
                alt="Elevanthe"
                width={300}
                height={300}
                className="object-contain drop-shadow-[0_0_48px_rgba(80,120,255,0.55)] hidden dark:block"
                loading="eager"
                sizes="300px"
                decoding="async"
              />
              {/* Logo light */}
              <Image
                src="/elevanthe-logo-light.png"
                alt="Elevanthe"
                width={300}
                height={300}
                className="object-contain drop-shadow-[0_4px_24px_rgba(80,120,255,0.25)] block dark:hidden"
                loading="eager"
                sizes="300px"
                decoding="async"
              />
            </div>

            {/* Card do formulário */}
            <div className="w-full rounded-2xl border shadow-xl px-8 py-9 relative bg-white dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.08] backdrop-blur-sm">

              {/* Linha de brilho no topo do card */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent dark:via-white/[0.12]" />

              {/* Header do form */}
              <div className="mb-8">
                <h1
                  className="text-[1.85rem] font-black tracking-tight leading-tight text-[#0a0a0a] dark:text-[#f2f2f2]"
                  style={{ fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)" }}
                >
                  {isSignIn ? "Entrar na conta" : "Criar conta grátis"}
                </h1>
                <p className="text-sm mt-2 leading-relaxed text-black/45 dark:text-white/40">
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
                      className="text-xs font-semibold tracking-wide uppercase text-black/40 dark:text-white/40"
                    >
                      Nome completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-black/25 dark:text-white/20" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        className="pl-10 h-11 rounded-xl text-sm bg-black/[0.03] border-black/[0.09] text-black placeholder:text-black/30 focus-visible:ring-black/10 focus-visible:border-black/20 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder:text-white/20 dark:focus-visible:ring-white/20 dark:focus-visible:border-white/25"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold tracking-wide uppercase text-black/40 dark:text-white/40"
                  >
                    E-mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-black/25 dark:text-white/20" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="pl-10 h-11 rounded-xl text-sm bg-black/[0.03] border-black/[0.09] text-black placeholder:text-black/30 focus-visible:ring-black/10 focus-visible:border-black/20 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder:text-white/20 dark:focus-visible:ring-white/20 dark:focus-visible:border-white/25"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs font-semibold tracking-wide uppercase text-black/40 dark:text-white/40"
                    >
                      Senha
                    </Label>
                    {isSignIn && (
                      <Link
                        href="/esqueci-senha"
                        className="text-xs transition-colors text-black/40 dark:text-white/40"
                      >
                        Esqueci a senha
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-black/25 dark:text-white/20" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isSignIn ? "Sua senha" : "Mínimo 8 caracteres"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={8}
                      className="pl-10 pr-11 h-11 rounded-xl text-sm bg-black/[0.03] border-black/[0.09] text-black placeholder:text-black/30 focus-visible:ring-black/10 focus-visible:border-black/20 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder:text-white/20 dark:focus-visible:ring-white/20 dark:focus-visible:border-white/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors text-black/30 dark:text-white/20"
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

                {/* Botão de submit */}
                <button
                  type="submit"
                  disabled={loading || turnstileVerifying || !turnstileVerified}
                  className="w-full h-11 rounded-full text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-40 disabled:cursor-not-allowed bg-[#0a0a0a] text-[#f2f2f2] dark:bg-[#f2f2f2] dark:text-[#0a0a0a]"
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

                {/* Separador */}
                <div className="relative flex items-center gap-3 mt-1">
                  <div className="flex-1 h-px bg-black/[0.08] dark:bg-white/[0.08]" />
                  <span className="text-xs text-black/30 dark:text-white/25 font-medium">ou</span>
                  <div className="flex-1 h-px bg-black/[0.08] dark:bg-white/[0.08]" />
                </div>

                {/* Botão Google */}
                <GoogleButton />
              </form>

              <p className="mt-6 text-center text-sm text-black/40 dark:text-white/30">
                {isSignIn ? (
                  <>
                    Não tem conta?{" "}
                    <Link
                      href="/sign-up"
                      className="font-semibold hover:underline transition-colors text-[#0a0a0a] dark:text-[#f2f2f2]"
                    >
                      Criar conta grátis
                    </Link>
                  </>
                ) : (
                  <>
                    Já tem conta?{" "}
                    <Link
                      href="/sign-in"
                      className="font-semibold hover:underline transition-colors text-[#0a0a0a] dark:text-[#f2f2f2]"
                    >
                      Entrar
                    </Link>
                  </>
                )}
              </p>

              <div className="mt-5 text-center flex flex-col items-center gap-2">
                <p className="text-[11px] text-black/30 dark:text-white/25 leading-relaxed max-w-[300px]">
                  Ao criar uma conta ou efetuar login, você concorda com os{" "}
                  <Link href="/termos" className="underline hover:text-black/50 dark:hover:text-white/45 transition-colors">
                    Termos de Uso e Política de Reembolso
                  </Link>.
                </p>
              </div>
            </div>

            {/* Wordmark ELEVANTHE abaixo do card */}
            <div
              className="select-none pointer-events-none text-center text-foreground/20 font-black tracking-[0.3em]"
              style={{ fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)", fontSize: "clamp(1.1rem, 3vw, 1.5rem)" }}
            >
              ELEVANTHE
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

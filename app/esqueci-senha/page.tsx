"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TurnstileWidget } from "@/components/turnstile-widget"
import { useTurnstile } from "@/hooks/use-turnstile"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle, Lock, Mail, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"


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
        "size-8 rounded-full flex items-center justify-center transition-all duration-200 border hover:scale-105",
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

function ThemedLogo({ className, forceDark }: { className?: string; forceDark?: boolean }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className={cn("opacity-0", className)} style={{ height: 40, width: 200 }} />
  const isDark = forceDark || resolvedTheme === "dark"
  return (
    <Image
      src={isDark ? "/elevanthe-logo-transparent-dark.png" : "/elevanthe-logo-transparent-light.png"}
      alt="Elevanthe CRM"
      width={200}
      height={50}
      className={cn("object-contain", className)}
      priority
    />
  )
}

export default function EsqueciSenhaPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const isDark = !mounted || resolvedTheme === "dark"

  const {
    isVerified: turnstileVerified,
    isVerifying: turnstileVerifying,
    error: turnstileError,
    handleSuccess: onTurnstileSuccess,
    handleExpire: onTurnstileExpire,
    handleError: onTurnstileError,
    verifyToken,
  } = useTurnstile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const tokenValid = await verifyToken()
    if (!tokenValid) return
    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      // Chama diretamente o endpoint do better-auth para solicitar reset de senha
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo }),
      })
      if (!res.ok && res.status !== 200) {
        // Mesmo em caso de erro 4xx ainda mostramos sucesso por segurança
        // (não revelamos se o e-mail está ou não cadastrado)
        console.warn("[esqueci-senha] status:", res.status)
      }
      setSent(true)
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.")
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
        style={{ backgroundColor: "#0a0a0a", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Dots pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Marca d'agua elefante */}
        <div className="absolute -bottom-20 -right-20 opacity-[0.03] pointer-events-none select-none">
          <Image
            src="/elevanthe-logo-neon.png"
            alt=""
            width={480}
            height={480}
            className="object-contain"
            loading="lazy"
            fetchPriority="low"
            sizes="480px"
            decoding="async"
          />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <ThemedLogo forceDark className="h-10 w-auto" />
        </div>

        {/* Conteudo central */}
        <div className="relative z-10 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 bg-white/5 w-fit">
            <Lock className="size-3 text-white/40" />
            <span className="text-[11px] font-semibold text-white/50 tracking-widest uppercase">
              Segurança da conta
            </span>
          </div>

          <h2
            className="text-[2.6rem] xl:text-[3.2rem] font-black leading-[1.04] tracking-tighter text-balance text-white"
            style={{ fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)" }}
          >
            Recupere o<br />
            acesso à sua<br />
            <span className="text-white/40">conta.</span>
          </h2>

          <p className="text-sm leading-relaxed text-white/35 max-w-xs">
            Enviaremos um link seguro para o seu e-mail. O link expira em 30 minutos.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-3 mt-2">
            {[
              { n: "01", label: "Informe seu e-mail cadastrado" },
              { n: "02", label: "Receba o link de redefinição" },
              { n: "03", label: "Crie uma nova senha segura" },
            ].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-white/20 tabular-nums w-6 shrink-0">{n}</span>
                <span className="text-[13px] text-white/40">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[11px] text-white/15">
            &copy; {new Date().getFullYear()} Elevanthe. Todos os direitos reservados.
          </p>
        </div>
      </aside>

      {/* ─── Painel direito — formulário ─── */}
      <div
        className="flex-1 flex flex-col min-h-screen relative overflow-hidden"
        style={{ backgroundColor: isDark ? "#080808" : "#f8f8f8" }}
      >
        {/* Dots pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: isDark
              ? "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)"
              : "radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Gradiente overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #080808 100%)"
              : "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #f8f8f8 100%)",
          }}
        />

        {/* Top bar */}
        <div
          className="relative z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)" }}
        >
          <div className="lg:hidden">
            <ThemedLogo className="h-8 w-auto" />
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2.5">
            <ThemeToggleButton />
            <Link
              href="/sign-in"
              className={cn(
                "text-xs transition-colors border rounded-full px-4 py-1.5 font-medium",
                isDark
                  ? "text-white/50 hover:text-white border-white/10 hover:border-white/25 hover:bg-white/5"
                  : "text-black/50 hover:text-black border-black/10 hover:border-black/25 hover:bg-black/5"
              )}
            >
              Voltar ao login
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
            {/* Linha de brilho no topo */}
            <div
              className="absolute top-0 left-8 right-8 h-px"
              style={{
                background: isDark
                  ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)"
                  : "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)",
              }}
            />

            {sent ? (
              /* ─── Estado: e-mail enviado ─── */
              <div className="flex flex-col items-center gap-6 py-2">
                <div
                  className="size-14 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                  }}
                >
                  <CheckCircle
                    className="size-7"
                    style={{ color: isDark ? "#f2f2f2" : "#0a0a0a" }}
                  />
                </div>
                <div className="text-center space-y-2">
                  <h1
                    className="text-[1.6rem] font-black tracking-tight leading-tight"
                    style={{
                      color: isDark ? "#f2f2f2" : "#0a0a0a",
                      fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
                    }}
                  >
                    E-mail enviado
                  </h1>
                  <p
                    className="text-sm leading-relaxed max-w-xs"
                    style={{ color: isDark ? "rgba(242,242,242,0.4)" : "rgba(10,10,10,0.45)" }}
                  >
                    Se o endereço{" "}
                    <span
                      className="font-semibold"
                      style={{ color: isDark ? "#f2f2f2" : "#0a0a0a" }}
                    >
                      {email}
                    </span>{" "}
                    estiver cadastrado, você receberá as instruções em instantes.
                  </p>
                </div>
                <Link
                  href="/sign-in"
                  className="flex items-center gap-2 text-sm font-semibold hover:underline transition-colors"
                  style={{ color: isDark ? "rgba(242,242,242,0.5)" : "rgba(10,10,10,0.5)" }}
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar para o login
                </Link>
              </div>
            ) : (
              /* ─── Estado: formulário ─── */
              <>
                <div className="mb-8">
                  <h1
                    className="text-[1.85rem] font-black tracking-tight leading-tight"
                    style={{
                      color: isDark ? "#f2f2f2" : "#0a0a0a",
                      fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
                    }}
                  >
                    Recuperar senha
                  </h1>
                  <p
                    className="text-sm mt-2 leading-relaxed"
                    style={{ color: isDark ? "rgba(242,242,242,0.4)" : "rgba(10,10,10,0.45)" }}
                  >
                    Informe seu e-mail e enviaremos um link para redefinir sua senha.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold tracking-wide uppercase"
                      style={{ color: isDark ? "rgba(242,242,242,0.4)" : "rgba(10,10,10,0.4)" }}
                    >
                      E-mail cadastrado
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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

                  <TurnstileWidget
                    onSuccess={onTurnstileSuccess}
                    onExpire={onTurnstileExpire}
                    onError={onTurnstileError}
                  />
                  {turnstileError && (
                    <p className="text-xs text-red-400 text-center -mt-1">{turnstileError}</p>
                  )}
                  {error && (
                    <p className="text-xs text-red-400 text-center">{error}</p>
                  )}

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
                        Enviando...
                      </span>
                    ) : (
                      <>
                        Enviar link de recuperação
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </form>

                <Link
                  href="/sign-in"
                  className="mt-6 flex items-center justify-center gap-1.5 text-sm transition-colors"
                  style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.35)" }}
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar para o login
                </Link>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

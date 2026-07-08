"use client"

import { useState, useRef } from "react"
import { Shield, User, Lock, Eye, EyeOff, ArrowRight, Activity } from "lucide-react"
import { TurnstileWidget, type TurnstileWidgetRef } from "@/components/turnstile-widget"
import { useTurnstile } from "@/hooks/use-turnstile"
import Image from "next/image"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const turnstileRef = useRef<TurnstileWidgetRef>(null)

  const {
    isVerified: turnstileVerified,
    isVerifying: turnstileVerifying,
    error: turnstileError,
    handleSuccess: onTurnstileSuccess,
    handleExpire: onTurnstileExpire,
    handleError: onTurnstileError,
    verifyToken,
    reset: resetTurnstile,
  } = useTurnstile()

  function resetChallenge() {
    resetTurnstile()
    turnstileRef.current?.reset()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const tokenValid = await verifyToken()
    if (!tokenValid) {
      resetChallenge()
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Credenciais inválidas.")
        resetChallenge()
        return
      }
      window.location.href = `/admin?t=${data.token ?? ""}`
    } catch {
      setError("Erro de conexão. Tente novamente.")
      resetChallenge()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#07070d] relative overflow-hidden">

      {/* ── Background grid pattern ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Glow orbs ── */}
      <div className="pointer-events-none absolute -top-32 -left-32 size-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[300px] rounded-full bg-primary/6 blur-[80px]" />

      {/* ── Painel esquerdo — branding ── */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image src="/elevanthe-icon.png" alt="Elevanthe" width={36} height={36} className="object-contain" />
          <div>
            <p className="text-white font-bold text-base leading-none">Elevanthe CRM</p>
            <p className="text-white/35 text-xs mt-0.5">Área administrativa</p>
          </div>
        </div>

        {/* Central copy */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-4 py-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Sistema operacional</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
            Painel de<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-primary">
              Controle
            </span>
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            Gerencie usuários, licenças, tickets de suporte e métricas da plataforma em um único lugar.
          </p>


        </div>

        {/* Footer */}
        <p className="text-xs text-white/20">
          Acesso monitorado e registrado. Apenas pessoal autorizado.
        </p>
      </div>

      {/* ── Divisor vertical ── */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />

      {/* ── Painel direito — formulário ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">

        {/* Logo mobile */}
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <Image src="/elevanthe-icon.png" alt="Elevanthe" width={32} height={32} className="object-contain" />
          <p className="text-white font-bold text-sm">Elevanthe CRM</p>
        </div>

        <div className="w-full max-w-[380px]">
          {/* Header do form */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-primary/20 border border-primary/20 flex items-center justify-center shadow-xl shadow-primary/10">
              <Shield className="size-7 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-white tracking-tight">Acesso Restrito</h2>
              <p className="text-sm text-white/35 mt-1">Entre com suas credenciais de administrador</p>
            </div>
          </div>

          {/* Card do form */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-7 backdrop-blur-sm shadow-2xl shadow-black/50">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Usuário */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Usuário</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/20" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="Seu usuário"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/15 focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/20" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder:text-white/15 focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
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

              {/* Erros */}
              {(error || turnstileError) && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-3.5 py-2.5">
                  <Shield className="size-4 shrink-0" />
                  <span>{error || turnstileError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || turnstileVerifying || !turnstileVerified}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-primary/25"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Verificando...
                  </>
                ) : (
                  <>
                    Entrar no painel
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Status badge */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <Activity className="size-3 text-white/20" />
            <p className="text-center text-xs text-white/15">
              Acesso monitorado — apenas pessoal autorizado
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

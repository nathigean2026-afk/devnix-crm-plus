"use client"

import { useState } from "react"
import { Shield, User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
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
        return
      }
      window.location.href = `/admin?t=${data.token ?? ""}`
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08080e] px-4 relative overflow-hidden">
      {/* Glow de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Logo no topo */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
        <Image src="/elevanthe-icon.png" alt="Elevanthe" width={24} height={24} className="object-contain opacity-50" />
        <span className="text-xs font-semibold text-white/30 tracking-wider uppercase">Elevanthe CRM</span>
      </div>

      <div className="relative z-10 w-full max-w-[360px]">
        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 shadow-2xl shadow-black/60 backdrop-blur-sm">
          {/* Header */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="size-14 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shadow-lg shadow-primary/10">
              <Shield className="size-6 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-black text-white tracking-tight">Acesso ao Painel</h1>
              <p className="text-xs text-white/30 mt-1">Área restrita — Elevanthe Admin</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/15 focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] transition-all text-sm"
                  placeholder="Seu usuário"
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
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-11 py-2.5 text-white placeholder:text-white/15 focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] transition-all text-sm"
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

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-3.5 py-2.5">
                <Shield className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all text-sm mt-1 shadow-lg shadow-primary/20"
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

        {/* Footer */}
        <p className="text-center text-xs text-white/15 mt-6">
          Acesso monitorado. Apenas pessoal autorizado.
        </p>
      </div>
    </div>
  )
}

"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080808]" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  // Token ausente — link inválido
  if (!token) {
    return (
      <main className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
        <div className="rounded-2xl border border-white/10 bg-[#111118] p-8 w-full max-w-sm text-center space-y-4">
          <AlertCircle className="size-12 text-red-400 mx-auto" />
          <h1 className="text-white font-bold text-lg">Link inválido</h1>
          <p className="text-white/50 text-sm">
            Este link de redefinição de senha é inválido ou foi expirado. Solicite um novo.
          </p>
          <Link
            href="/esqueci-senha"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Solicitar novo link
          </Link>
        </div>
      </main>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")
    if (password.length < 8) {
      setErrorMsg("A senha deve ter pelo menos 8 caracteres.")
      setStatus("error")
      return
    }
    if (password !== confirm) {
      setErrorMsg("As senhas não coincidem.")
      setStatus("error")
      return
    }

    setStatus("loading")
    try {
      // better-auth resetPassword usa o token da URL e atualiza a senha diretamente
      const { error } = await authClient.resetPassword({ newPassword: password, token })
      if (error) {
        setErrorMsg(
          error.message?.includes("expired")
            ? "Este link expirou. Solicite um novo e-mail de recuperação."
            : error.message ?? "Ocorreu um erro. Tente novamente."
        )
        setStatus("error")
      } else {
        setStatus("success")
        setTimeout(() => router.push("/sign-in"), 2500)
      }
    } catch {
      setErrorMsg("Erro de conexão. Verifique sua internet e tente novamente.")
      setStatus("error")
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      {/* Dots pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #080808 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/elevanthe-logo-transparent-dark.png"
            alt="Elevanthe CRM"
            width={160}
            height={40}
            className="object-contain"
            priority
          />
        </div>

        <div
          className="rounded-2xl border border-white/10 px-8 py-9 relative overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}
        >
          {/* Linha de brilho no topo */}
          <div
            className="absolute top-0 left-8 right-8 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
          />

          {status === "success" ? (
            <div className="flex flex-col items-center gap-5 py-2 text-center">
              <div className="size-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <CheckCircle2 className="size-7 text-green-400" />
              </div>
              <div className="space-y-2">
                <h1 className="text-white font-black text-2xl tracking-tight">Senha redefinida!</h1>
                <p className="text-white/40 text-sm leading-relaxed">
                  Sua senha foi atualizada com sucesso. Redirecionando para o login...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Lock className="size-4 text-white/50" />
                </div>
                <h1 className="text-white font-black text-2xl tracking-tight leading-tight">
                  Nova senha
                </h1>
                <p className="text-white/40 text-sm mt-1.5 leading-relaxed">
                  Escolha uma senha segura com pelo menos 8 caracteres.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo nova senha */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold tracking-widest uppercase text-white/35">
                    Nova senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Mínimo 8 caracteres"
                      className="w-full h-11 rounded-xl px-4 pr-10 text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/10 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Campo confirmar senha */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold tracking-widest uppercase text-white/35">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      placeholder="Repita a senha"
                      className="w-full h-11 rounded-xl px-4 pr-10 text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/10 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Barra de força da senha */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => {
                        const strength =
                          password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? 4
                          : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
                          : password.length >= 8 ? 2
                          : 1
                        const active = i <= strength
                        const color = strength === 4 ? "#22c55e" : strength === 3 ? "#3b82f6" : strength === 2 ? "#f59e0b" : "#ef4444"
                        return (
                          <div
                            key={i}
                            className="flex-1 h-1 rounded-full transition-all duration-300"
                            style={{ backgroundColor: active ? color : "rgba(255,255,255,0.07)" }}
                          />
                        )
                      })}
                    </div>
                    <p className="text-[11px] text-white/30">
                      {password.length < 8 ? "Muito curta"
                        : password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? "Muito forte"
                        : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? "Forte"
                        : "Boa"}
                    </p>
                  </div>
                )}

                {/* Erro */}
                {status === "error" && errorMsg && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                    <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400 leading-relaxed">{errorMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full h-11 rounded-full text-sm font-bold bg-white text-black hover:bg-white/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                >
                  {status === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Salvando...
                    </span>
                  ) : "Redefinir senha"}
                </button>
              </form>

              <Link
                href="/sign-in"
                className="mt-6 flex items-center justify-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Voltar para o login
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

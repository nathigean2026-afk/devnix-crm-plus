"use client"

import { Suspense, useState, useTransition } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { updatePasswordByToken } from "@/lib/actions"
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from "lucide-react"
import Image from "next/image"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""
  const userId = searchParams.get("userId") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [isPending, startTransition] = useTransition()

  if (!token || !userId) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="rounded-2xl border border-white/10 bg-[#111118] p-8 w-full max-w-sm text-center">
          <AlertCircle className="size-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-white font-bold text-lg mb-2">Link inválido</h1>
          <p className="text-white/50 text-sm">Este link de redefinição de senha é inválido ou incompleto.</p>
        </div>
      </main>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    setErrorMsg("")
    startTransition(async () => {
      const result = await updatePasswordByToken(token, userId, password)
      if (result.ok) {
        setStatus("success")
      } else {
        setStatus("error")
        setErrorMsg(result.message ?? "Erro ao redefinir senha.")
      }
    })
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="rounded-2xl border border-white/10 bg-[#111118] p-8 w-full max-w-sm shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <Image
            src="/elevanthe-icon.png"
            alt="Elevanthe"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <div>
            <p className="text-white font-bold text-sm leading-none">Elevanthe CRM</p>
            <p className="text-white/40 text-xs mt-0.5">Redefinir senha</p>
          </div>
        </div>

        {status === "success" ? (
          <div className="text-center py-4">
            <CheckCircle2 className="size-14 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-lg mb-2">Senha redefinida!</h2>
            <p className="text-white/50 text-sm mb-6">Sua senha foi atualizada com sucesso. Você já pode fazer login.</p>
            <button
              onClick={() => router.push("/sign-in")}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              Ir para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-white font-bold text-lg mb-1">Nova senha</h2>
              <p className="text-white/40 text-sm">Defina uma nova senha para sua conta.</p>
            </div>

            {status === "error" && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="size-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-xs">{errorMsg}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/60">Nova senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/60">Confirmar nova senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  minLength={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {isPending ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

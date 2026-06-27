"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ShieldAlert, ArrowRight } from "lucide-react"

const COUNTDOWN = 8

export default function SessaoEncerradaPage() {
  const router = useRouter()
  const [seconds, setSeconds] = useState(COUNTDOWN)

  useEffect(() => {
    if (seconds <= 0) {
      router.replace("/sign-in")
      return
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds, router])

  const progress = ((COUNTDOWN - seconds) / COUNTDOWN) * 100

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Fundo com glow sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5">
        <Image src="/elevanthe-icon.png" alt="Elevanthe CRM" width={30} height={30} className="object-contain" />
        <span className="text-white/70 font-semibold text-sm">Elevanthe CRM</span>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center gap-6">
        {/* Ícone */}
        <div className="relative">
          <div className="size-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ShieldAlert className="size-9 text-amber-400" />
          </div>
          {/* Ring de countdown animado */}
          <svg
            className="absolute inset-0 -rotate-90"
            width="80" height="80"
            viewBox="0 0 80 80"
          >
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="rgba(245,158,11,0.15)"
              strokeWidth="3"
            />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="rgba(245,158,11,0.7)"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
        </div>

        {/* Mensagem */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sessão encerrada
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Sua conta foi acessada em outro dispositivo ou navegador.
            Por segurança, esta sessão foi encerrada automaticamente.
          </p>
        </div>

        {/* Card de info */}
        <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-left space-y-1">
          <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">Por que isso aconteceu?</p>
          <p className="text-sm text-white/40 leading-relaxed">
            O Elevanthe CRM permite apenas uma sessão ativa por conta. Quando um novo login é realizado, todas as sessões anteriores são encerradas automaticamente.
          </p>
        </div>

        {/* Countdown + botão */}
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-sm text-white/30">
            Redirecionando para o login em{" "}
            <span className="text-amber-400 font-bold tabular-nums">{seconds}</span>
            {" "}segundo{seconds !== 1 ? "s" : ""}...
          </p>
          <button
            onClick={() => router.replace("/sign-in")}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors w-full justify-center"
          >
            Ir para o login agora
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-white/15">
        &copy; {new Date().getFullYear()} Elevanthe. Todos os direitos reservados.
      </p>
    </div>
  )
}

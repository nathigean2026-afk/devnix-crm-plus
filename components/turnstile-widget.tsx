"use client"

import { Turnstile } from "@marsidev/react-turnstile"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { ShieldAlert } from "lucide-react"

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
  onExpire?: () => void
  onError?: () => void
}

export function TurnstileWidget({ onSuccess, onExpire, onError }: TurnstileWidgetProps) {
  const { resolvedTheme } = useTheme()
  const [blocked, setBlocked] = useState(false)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    // Detecta ad blocker: se o script da Cloudflare não carregou em 4s,
    // provavelmente está bloqueado — avisa o usuário
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && !(window as any).turnstile) {
        setBlocked(true)
        // Dispara onError para o form saber que está bloqueado
        onError?.()
      }
    }, 4000)
    return () => clearTimeout(timer)
  }, [onError])

  if (!siteKey) return null

  if (blocked) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-400 my-2">
        <ShieldAlert className="size-3.5 shrink-0 mt-0.5" />
        <span>
          O verificador de segurança foi bloqueado pelo seu navegador ou extensão.
          Desative o bloqueador de anúncios para esta página e recarregue.
        </span>
      </div>
    )
  }

  return (
    <div className="flex justify-center my-2">
      <Turnstile
        siteKey={siteKey}
        onSuccess={onSuccess}
        onExpire={onExpire}
        onError={onError}
        options={{
          theme: resolvedTheme === "dark" ? "dark" : "light",
          language: "pt-br",
          size: "normal",
        }}
      />
    </div>
  )
}

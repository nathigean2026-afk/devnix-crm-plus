"use client"

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import { useTheme } from "next-themes"
import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react"
import { ShieldAlert } from "lucide-react"

export interface TurnstileWidgetRef {
  reset: () => void
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
  onExpire?: () => void
  onError?: () => void
}

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  function TurnstileWidget({ onSuccess, onExpire, onError }, ref) {
    const { resolvedTheme } = useTheme()
    const [blocked, setBlocked] = useState(false)
    const turnstileRef = useRef<TurnstileInstance>(null)

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    // Expõe reset() para o pai poder resetar o widget após falha de login
    useImperativeHandle(ref, () => ({
      reset: () => {
        turnstileRef.current?.reset()
      },
    }))

    useEffect(() => {
      const timer = setTimeout(() => {
        if (typeof window !== "undefined" && !(window as any).turnstile) {
          setBlocked(true)
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
          ref={turnstileRef}
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
)

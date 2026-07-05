"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface LicenseWatcherProps {
  /** Data ISO string de expiração da licença */
  expiresAt: string
}

/**
 * Componente invisível que monitora a expiração da licença no lado do cliente.
 * Quando a licença expirar, redireciona imediatamente para /planos sem precisar
 * de uma navegação manual do usuário.
 */
export function LicenseWatcher({ expiresAt }: LicenseWatcherProps) {
  const router = useRouter()

  useEffect(() => {
    const expiry = new Date(expiresAt).getTime()
    const now = Date.now()
    const msUntilExpiry = expiry - now

    // Se já expirou, redireciona imediatamente
    if (msUntilExpiry <= 0) {
      router.replace("/planos")
      return
    }

    // Agenda o redirecionamento para exatamente quando expirar
    // Limitado a 2^31-1 ms (~24 dias) — máximo do setTimeout
    const timeoutMs = Math.min(msUntilExpiry, 2147483647)
    const timer = setTimeout(() => {
      router.replace("/planos")
    }, timeoutMs)

    return () => clearTimeout(timer)
  }, [expiresAt, router])

  return null
}

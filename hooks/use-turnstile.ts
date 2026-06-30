"use client"

import { useState, useCallback } from "react"

interface UseTurnstileReturn {
  token: string | null
  isVerified: boolean
  isVerifying: boolean
  error: string | null
  handleSuccess: (token: string) => void
  handleExpire: () => void
  handleError: () => void
  verifyToken: () => Promise<boolean>
  reset: () => void
}

export function useTurnstile(): UseTurnstileReturn {
  const [token, setToken] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Se não há site key configurada (dev), considera sempre verificado
  const siteKeyMissing = !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const handleSuccess = useCallback((t: string) => {
    setToken(t)
    setIsVerified(true)
    setError(null)
  }, [])

  const handleExpire = useCallback(() => {
    setToken(null)
    setIsVerified(false)
    setError("O desafio de segurança expirou. Complete novamente.")
  }, [])

  const handleError = useCallback(() => {
    setToken(null)
    setIsVerified(false)
    setError("Erro ao carregar o verificador de segurança. Recarregue a página.")
  }, [])

  const verifyToken = useCallback(async (): Promise<boolean> => {
    if (siteKeyMissing) return true

    if (!token) {
      setError("Complete o desafio de segurança antes de continuar.")
      return false
    }

    setIsVerifying(true)
    setError(null)

    try {
      const res = await fetch("/api/turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? "Verificação de segurança falhou.")
        setIsVerified(false)
        setToken(null)
        return false
      }

      return true
    } catch {
      setError("Erro ao verificar segurança. Tente novamente.")
      return false
    } finally {
      setIsVerifying(false)
    }
  }, [token, siteKeyMissing])

  const reset = useCallback(() => {
    setToken(null)
    setIsVerified(false)
    setIsVerifying(false)
    setError(null)
  }, [])

  return {
    token,
    isVerified: siteKeyMissing ? true : isVerified,
    isVerifying,
    error,
    handleSuccess,
    handleExpire,
    handleError,
    verifyToken,
    reset,
  }
}

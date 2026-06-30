"use client"

import { Turnstile } from "@marsidev/react-turnstile"
import { useTheme } from "next-themes"

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
  onExpire?: () => void
  onError?: () => void
}

export function TurnstileWidget({ onSuccess, onExpire, onError }: TurnstileWidgetProps) {
  const { resolvedTheme } = useTheme()

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  if (!siteKey) {
    // Em desenvolvimento sem chave configurada, libera automaticamente
    return null
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

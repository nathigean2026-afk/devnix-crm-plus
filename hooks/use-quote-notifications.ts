"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

const POLL_INTERVAL = 20_000 // 20 segundos

export function useQuoteNotifications() {
  // Mantém o timestamp do último check em ref para não causar re-render
  const sinceRef = useRef<string>(new Date().toISOString())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/notifications/quotes?since=${encodeURIComponent(sinceRef.current)}`, {
          cache: "no-store",
        })
        if (!res.ok) return

        const data = await res.json() as {
          quotes: Array<{
            id: string
            number: number
            title: string
            status: string
            respondedAt: string | null
          }>
        }

        // Atualiza o timestamp para o próximo polling
        sinceRef.current = new Date().toISOString()

        for (const q of data.quotes) {
          const num = `#${String(q.number).padStart(4, "0")}`
          if (q.status === "aprovado") {
            toast.success(`Orçamento ${num} aprovado`, {
              description: q.title,
              duration: 8000,
            })
          } else if (q.status === "recusado") {
            toast.error(`Orçamento ${num} recusado`, {
              description: q.title,
              duration: 8000,
            })
          }
        }
      } catch {
        // Polling falha silenciosamente — não deve quebrar a UI
      }
    }

    // Primeira verificação após 5s (evita notificar respostas antigas logo ao carregar)
    const initialTimer = setTimeout(poll, 5_000)
    timerRef.current = setInterval(poll, POLL_INTERVAL)

    return () => {
      clearTimeout(initialTimer)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])
}

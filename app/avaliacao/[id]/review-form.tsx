"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, CheckCircle2, Loader2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ReviewFormProps {
  serviceOrderId: string
  osTitle: string
  osNumber: number
  providerName: string
  providerLogo: string | null
  clientName: string
  alreadyReviewed: boolean
  existingRating?: number
  existingComment?: string
}

export default function ReviewForm({
  serviceOrderId,
  osTitle,
  osNumber,
  providerName,
  providerLogo,
  clientName,
  alreadyReviewed,
  existingRating,
  existingComment,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingRating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState(existingComment ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(alreadyReviewed)

  async function handleSubmit() {
    if (rating === 0) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/avaliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceOrderId, rating, comment }),
      })
      if (res.ok) setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  const labels = ["", "Muito insatisfeito", "Insatisfeito", "Regular", "Satisfeito", "Muito satisfeito"]
  const displayRating = hovered || rating

  return (
    <main className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        {/* Header do prestador */}
        <div className="flex flex-col items-center gap-3 mb-8">
          {providerLogo ? (
            <div className="relative size-16 rounded-2xl overflow-hidden border border-border">
              <Image src={providerLogo} alt={providerName} fill className="object-cover" />
            </div>
          ) : (
            <div className="size-16 rounded-2xl bg-accent flex items-center justify-center text-2xl font-bold text-accent-foreground">
              {providerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-center">
            <p className="font-semibold text-foreground">{providerName}</p>
            <p className="text-xs text-muted-foreground">
              OS #{String(osNumber).padStart(4, "0")} — {osTitle}
            </p>
          </div>
        </div>

        {done ? (
          /* Estado: avaliação enviada */
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="size-14 text-emerald-500" />
            <h1 className="text-xl font-semibold text-foreground">Obrigado pela avaliação!</h1>
            <p className="text-sm text-muted-foreground max-w-xs">
              Sua opinião é muito importante para <strong>{providerName}</strong>. Agradecemos a confiança!
            </p>
            {rating > 0 && (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={cn("size-6", s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Formulário */
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-foreground mb-1 text-center">
              Como foi o serviço?
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Olá, <strong>{clientName.split(" ")[0]}</strong>! Avalie sua experiência.
            </p>

            {/* Estrelas */}
            <div
              className="flex justify-center gap-2 mb-2"
              onMouseLeave={() => setHovered(0)}
            >
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHovered(s)}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110 active:scale-95"
                  aria-label={`${s} estrelas`}
                >
                  <Star
                    className={cn(
                      "size-9 transition-colors",
                      s <= displayRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/25 hover:text-amber-300"
                    )}
                  />
                </button>
              ))}
            </div>

            {displayRating > 0 && (
              <p className="text-center text-xs font-medium text-muted-foreground mb-5 min-h-4 transition-all">
                {labels[displayRating]}
              </p>
            )}

            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Deixe um comentário (opcional)..."
              className="resize-none mb-4 text-sm min-h-[90px]"
              maxLength={500}
            />

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
            >
              {submitting ? (
                <><Loader2 className="size-4 mr-2 animate-spin" />Enviando...</>
              ) : (
                "Enviar avaliação"
              )}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}

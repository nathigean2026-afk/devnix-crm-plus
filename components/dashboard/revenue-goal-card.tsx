"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Target, Pencil, CheckCircle2, TrendingUp } from "lucide-react"
import { saveRevenueGoal } from "@/lib/actions"
import confetti from "canvas-confetti"

interface RevenueGoalCardProps {
  currentRevenue: number
  initialGoalCents: number | null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function RevenueGoalCard({ currentRevenue, initialGoalCents }: RevenueGoalCardProps) {
  const goalCents = initialGoalCents ?? null
  const goal = goalCents ? goalCents / 100 : null

  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [localGoal, setLocalGoal] = useState<number | null>(goal)
  const [isPending, startTransition] = useTransition()
  const celebratedRef = useRef(false)

  // Dispara festa quando meta é atingida (apenas uma vez por sessão)
  const isAchieved = localGoal ? currentRevenue >= localGoal : false
  useEffect(() => {
    if (isAchieved && !celebratedRef.current) {
      celebratedRef.current = true
      // Confetti da esquerda
      confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } })
      // Confetti da direita
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } })
      // Fogos do centro
      setTimeout(() => {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, startVelocity: 45 })
      }, 300)
    }
    if (!isAchieved) celebratedRef.current = false
  }, [isAchieved])

  function handleSave() {
    const digits = inputValue.replace(/\D/g, "")
    if (!digits) return
    const cents = Number(digits)
    if (isNaN(cents) || cents <= 0) return
    const newGoal = cents / 100
    setLocalGoal(newGoal)
    setEditing(false)
    startTransition(async () => {
      await saveRevenueGoal(cents)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSave()
    if (e.key === "Escape") setEditing(false)
  }

  function formatInput(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    const num = Number(digits) / 100
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  }

  const percent = localGoal ? Math.min((currentRevenue / localGoal) * 100, 100) : 0
  const remaining = localGoal ? Math.max(localGoal - currentRevenue, 0) : 0

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="size-3.5 text-primary" />
            </div>
            Meta de Faturamento
          </CardTitle>
          {!editing && (
            <button
              onClick={() => {
                setInputValue(localGoal ? String(Math.round(localGoal * 100)) : "")
                setEditing(true)
              }}
              className="size-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="size-3" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!localGoal && !editing ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">Defina uma meta mensal de faturamento</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="border-border text-foreground hover:bg-muted"
            >
              Definir meta
            </Button>
          </div>
        ) : editing ? (
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                autoFocus
                value={inputValue ? formatInput(inputValue) : ""}
                onChange={e => setInputValue(e.target.value.replace(/\D/g, "").padStart(3, "0"))}
                onKeyDown={handleKeyDown}
                placeholder="0,00"
                className="pl-9 bg-input border-border text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              <CheckCircle2 className="size-3.5 mr-1" />
              OK
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-black text-foreground tabular-nums">{formatCurrency(currentRevenue)}</p>
                <p className="text-xs text-muted-foreground">de {formatCurrency(localGoal!)} de meta</p>
              </div>
              {isAchieved ? (
                <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                  <CheckCircle2 className="size-4" />
                  Meta atingida!
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="size-3" />
                  Faltam {formatCurrency(remaining)}
                </div>
              )}
            </div>

            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${percent}%`,
                  backgroundColor: isAchieved ? "#22c55e" : percent > 70 ? "#f59e0b" : "hsl(var(--primary))",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{percent.toFixed(0)}% concluido</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

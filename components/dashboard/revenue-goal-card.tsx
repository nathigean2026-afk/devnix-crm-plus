"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Target, Pencil, CheckCircle2, TrendingUp } from "lucide-react"

const STORAGE_KEY = "elevanthe_revenue_goal"

interface RevenueGoalCardProps {
  currentRevenue: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function RevenueGoalCard({ currentRevenue }: RevenueGoalCardProps) {
  const [goal, setGoal] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = Number(saved)
      if (!isNaN(parsed) && parsed > 0) setGoal(parsed)
    }
  }, [])

  function handleSave() {
    const parsed = Number(inputValue.replace(/\D/g, "")) / 100
    if (isNaN(parsed) || parsed <= 0) return
    setGoal(parsed)
    localStorage.setItem(STORAGE_KEY, String(parsed))
    setEditing(false)
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

  if (!mounted) return null

  const percent = goal ? Math.min((currentRevenue / goal) * 100, 100) : 0
  const isAchieved = goal ? currentRevenue >= goal : false
  const remaining = goal ? Math.max(goal - currentRevenue, 0) : 0

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
                setInputValue(goal ? String(Math.round(goal * 100)) : "")
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
        {!goal && !editing ? (
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
            <Button size="sm" onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
              <CheckCircle2 className="size-3.5 mr-1" />
              OK
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-black text-foreground tabular-nums">{formatCurrency(currentRevenue)}</p>
                <p className="text-xs text-muted-foreground">de {formatCurrency(goal!)} de meta</p>
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

            {/* Barra de progresso */}
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${percent}%`,
                  backgroundColor: isAchieved ? "#22c55e" : percent > 70 ? "#f59e0b" : "hsl(var(--primary))",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{percent.toFixed(0)}% concluído</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

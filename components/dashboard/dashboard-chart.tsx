"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface DashboardChartProps {
  data: { month: string; receita: number; despesa: number }[]
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name === "receita" ? "Receita" : "Despesa"}:</span>
          <span className="font-semibold text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function DashboardChart({ data }: DashboardChartProps) {
  const hasData = data.some((d) => d.receita > 0 || d.despesa > 0)

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-foreground">
          Receita x Despesa — Últimos 6 meses
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            Receita
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" />
            Despesa
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Nenhum lançamento pago registrado ainda
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="despesaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border)" }} />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#receitaGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--primary)" }}
              />
              <Area
                type="monotone"
                dataKey="despesa"
                stroke="var(--destructive)"
                strokeWidth={2}
                fill="url(#despesaGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--destructive)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

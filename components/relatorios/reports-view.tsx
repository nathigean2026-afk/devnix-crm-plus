"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  DollarSign,
  UsersRound,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  Printer,
  MessageCircle,
  Send,
  Share2,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ReportsViewProps {
  data: {
    monthlyChart: { month: string; receita: number; despesa: number }[]
    quotesChart: { status: string; count: number }[]
    totalReceita: number
    totalDespesa: number
    totalPendente: number
    totalClients: number
    totalQuotes: number
    totalAprovados: number
    taxaConversao: number
    totalServices: number
  }
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  cancelado: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: "#6b7280",
  enviado: "#3b82f6",
  aprovado: "#22c55e",
  recusado: "#ef4444",
  cancelado: "#9ca3af",
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)
}

function formatCurrencyFull(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
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
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function ReportsView({ data }: ReportsViewProps) {
  const lucro = data.totalReceita - data.totalDespesa
  const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  const summaryCards = [
    { label: "Receita Total", value: formatCurrencyFull(data.totalReceita), icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Despesas Pagas", value: formatCurrencyFull(data.totalDespesa), icon: DollarSign, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Lucro Líquido", value: formatCurrencyFull(lucro), icon: DollarSign, color: lucro >= 0 ? "text-emerald-500" : "text-red-500", bg: lucro >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
    { label: "A Receber", value: formatCurrencyFull(data.totalPendente), icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Clientes", value: String(data.totalClients), icon: UsersRound, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Taxa de Conversão", value: `${data.taxaConversao}%`, icon: CheckCircle, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Orçamentos", value: String(data.totalQuotes), icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Aprovados", value: String(data.totalAprovados), icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
  ]

  function handlePrint() {
    window.print()
  }

  function handleWhatsApp() {
    const text =
      `*Relatório Financeiro — ${dataAtual}*\n\n` +
      `Receita Total: ${formatCurrencyFull(data.totalReceita)}\n` +
      `Despesas: ${formatCurrencyFull(data.totalDespesa)}\n` +
      `Lucro Líquido: ${formatCurrencyFull(lucro)}\n` +
      `A Receber: ${formatCurrencyFull(data.totalPendente)}\n` +
      `Taxa de Conversão: ${data.taxaConversao}%\n` +
      `Clientes: ${data.totalClients} | Orçamentos: ${data.totalQuotes}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  function handleTelegram() {
    const text =
      `Relatório Financeiro — ${dataAtual}\n` +
      `Receita: ${formatCurrencyFull(data.totalReceita)} | Despesas: ${formatCurrencyFull(data.totalDespesa)} | Lucro: ${formatCurrencyFull(lucro)}`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, "_blank")
  }

  function handleEmail() {
    const subject = `Relatório Financeiro — ${dataAtual}`
    const body =
      `Relatório Financeiro — ${dataAtual}\n\n` +
      `Receita Total: ${formatCurrencyFull(data.totalReceita)}\n` +
      `Despesas Pagas: ${formatCurrencyFull(data.totalDespesa)}\n` +
      `Lucro Líquido: ${formatCurrencyFull(lucro)}\n` +
      `A Receber: ${formatCurrencyFull(data.totalPendente)}\n` +
      `Clientes: ${data.totalClients}\n` +
      `Orçamentos: ${data.totalQuotes} (${data.totalAprovados} aprovados — ${data.taxaConversao}% conversão)`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-card { border: 1px solid #e5e7eb !important; background: white !important; }
          .print-text { color: #111827 !important; }
          .print-muted { color: #6b7280 !important; }
        }
      `}</style>

      <div className="flex flex-col gap-6">
        {/* Header com botões de compartilhamento */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground text-sm mt-1">Visão consolidada — {dataAtual}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsApp}
              className="border-green-600/30 text-green-400 hover:bg-green-500/10 hover:text-green-300 gap-1.5"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmail}
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 gap-1.5"
            >
              <Mail className="size-4" />
              E-mail
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTelegram}
              className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300 gap-1.5"
            >
              <Send className="size-4" />
              Telegram
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              <Printer className="size-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Summary grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summaryCards.map((card) => (
            <Card key={card.label} className="bg-card border-border print-card">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`rounded-lg p-2 ${card.bg} shrink-0 no-print`}>
                  <card.icon className={`size-4 ${card.color}`} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-xs text-muted-foreground leading-none print-muted">{card.label}</p>
                  <p className={`text-sm font-bold truncate ${card.color} print-text`}>{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Receita x Despesa */}
          <Card className="bg-card border-border lg:col-span-2 print-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground print-text">Receita x Despesa — Últimos 6 meses</CardTitle>
            </CardHeader>
            <CardContent>
              {data.monthlyChart.every(m => m.receita === 0 && m.despesa === 0) ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  Nenhum lançamento pago no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.monthlyChart} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status dos orçamentos */}
          <Card className="bg-card border-border print-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground print-text">Status dos Orçamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {data.quotesChart.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  Nenhum orçamento criado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.quotesChart}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="45%"
                      outerRadius={72}
                      innerRadius={36}
                      paddingAngle={3}
                    >
                      {data.quotesChart.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, STATUS_LABELS[name] ?? name]}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                    <Legend
                      formatter={(value) => STATUS_LABELS[value] ?? value}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo financeiro detalhado para impressão */}
        <Card className="bg-card border-border print-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground print-text">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-400 uppercase tracking-wide font-medium">Receita Realizada</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrencyFull(data.totalReceita)}</p>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400 uppercase tracking-wide font-medium">Despesas Pagas</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrencyFull(data.totalDespesa)}</p>
              </div>
              <div className={`flex flex-col gap-1 p-4 rounded-xl ${lucro >= 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                <p className={`text-xs uppercase tracking-wide font-medium ${lucro >= 0 ? "text-emerald-400" : "text-red-400"}`}>Lucro Líquido</p>
                <p className={`text-2xl font-bold ${lucro >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrencyFull(lucro)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion rate highlight */}
        <Card className="bg-card border-border print-card">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide print-muted">Taxa de Conversão de Orçamentos</p>
                <p className="text-4xl font-bold text-primary mt-1">{data.taxaConversao}%</p>
                <p className="text-sm text-muted-foreground mt-1 print-muted">
                  {data.totalAprovados} aprovados de {data.totalQuotes} orçamentos criados
                </p>
              </div>
              <div className="w-full sm:w-48 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${data.taxaConversao}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé para impressão */}
        <div className="hidden print:block text-center text-xs text-gray-400 mt-4">
          Relatório gerado em {dataAtual} via Elevanthe CRM
        </div>
      </div>
    </>
  )
}

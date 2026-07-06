"use client"

import { useRouter, useSearchParams } from "next/navigation"
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
  XCircle,
  Award,
  Wrench,
  Calendar,
  AlertCircle,
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
    totalRecusados: number
    taxaConversao: number
    totalServices: number
    topClientsByRevenue: { name: string; total: number; ordersCount: number }[]
    topClientsByOrders: { name: string; count: number }[]
    topServices: { name: string; count: number; revenue: number }[]
    rejectedQuotes: { number: number; title: string; total: string; rejectionReason: string | null; respondedAt: Date | null }[]
    periodDays: number
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

const PERIOD_OPTIONS = [
  { label: "Hoje", days: 1 },
  { label: "7 dias", days: 7 },
  { label: "15 dias", days: 15 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "180 dias", days: 180 },
  { label: "365 dias", days: 365 },
]

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const lucro = data.totalReceita - data.totalDespesa
  const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const periodLabel = PERIOD_OPTIONS.find(p => p.days === data.periodDays)?.label ?? `${data.periodDays} dias`

  function handlePeriodChange(days: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("days", String(days))
    router.push(`?${params.toString()}`)
  }

  function handlePrint() {
    const BRL = (v: number) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
    const lucroLocal = data.totalReceita - data.totalDespesa
    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    const maxRevenue = Math.max(...data.topClientsByRevenue.map(c => c.total), 1)
    const maxOrders = Math.max(...data.topClientsByOrders.map(c => c.count), 1)

    const statusLabels: Record<string, string> = { aprovado: "Aprovado", recusado: "Recusado", enviado: "Enviado", rascunho: "Rascunho", expirado: "Expirado", cancelado: "Cancelado" }

    function bar(value: number, max: number, color: string) {
      const pct = max > 0 ? Math.round((value / max) * 100) : 0
      return `<div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:10px;background:#f1f5f9;border-radius:5px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${color};border-radius:5px;"></div></div><span style="font-size:12px;color:#64748b;min-width:80px;text-align:right;">${BRL(value)}</span></div>`
    }
    function barCount(value: number, max: number, color: string) {
      const pct = max > 0 ? Math.round((value / max) * 100) : 0
      return `<div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:10px;background:#f1f5f9;border-radius:5px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${color};border-radius:5px;"></div></div><span style="font-size:12px;color:#64748b;min-width:40px;text-align:right;">${value}x</span></div>`
    }

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Relatório — ${periodLabel}</title>
<style>
  @page{size:A4;margin:20mm 18mm;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0f172a;background:#fff;font-size:13px;line-height:1.5;}
  h2{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0;}
  .header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:2px solid #1d4ed8;margin-bottom:24px;}
  .badge{display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:4px;border:1px solid #bfdbfe;}
  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;}
  .card{border:1px solid #e2e8f0;border-radius:8px;padding:12px;}
  .card .lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}
  .card .val{font-size:17px;font-weight:800;}
  .section{margin-bottom:24px;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  thead tr{background:#f8fafc;}
  th{padding:7px 10px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#64748b;border-bottom:1px solid #e2e8f0;}
  td{padding:7px 10px;border-bottom:1px solid #f1f5f9;color:#374151;}
  tr:last-child td{border-bottom:none;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;}
  .bar-list{display:flex;flex-direction:column;gap:10px;}
  .bar-item{display:flex;flex-direction:column;gap:4px;}
  .bar-name{font-size:12px;color:#374151;font-weight:500;}
  .summary{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;}
  .srow{display:flex;justify-content:space-between;padding:9px 14px;border-bottom:1px solid #f1f5f9;}
  .srow:last-child{border-bottom:none;}
  .footer{margin-top:32px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div class="header">
  <div><span class="badge">${periodLabel}</span><div style="font-size:20px;font-weight:800;">Relatório Analítico</div><div style="font-size:11px;color:#64748b;margin-top:3px;">Gerado em ${today}</div></div>
  <div style="text-align:right;font-size:11px;color:#64748b;"><strong style="display:block;font-size:15px;font-weight:700;color:#1d4ed8;">Elevanthe CRM</strong></div>
</div>

<div class="section"><h2>Resumo do Período</h2>
<div class="cards">
  <div class="card"><div class="lbl">Receita</div><div class="val" style="color:#16a34a;">${BRL(data.totalReceita)}</div></div>
  <div class="card"><div class="lbl">Despesas</div><div class="val" style="color:#dc2626;">${BRL(data.totalDespesa)}</div></div>
  <div class="card"><div class="lbl">Lucro Líquido</div><div class="val" style="color:${lucroLocal >= 0 ? "#1d4ed8" : "#dc2626"};">${BRL(lucroLocal)}</div></div>
  <div class="card"><div class="lbl">A Receber</div><div class="val" style="color:#d97706;">${BRL(data.totalPendente)}</div></div>
</div>
<div class="cards">
  <div class="card"><div class="lbl">Clientes</div><div class="val" style="color:#1d4ed8;">${data.totalClients}</div></div>
  <div class="card"><div class="lbl">Orçamentos</div><div class="val">${data.totalQuotes}</div></div>
  <div class="card"><div class="lbl">Aprovados</div><div class="val" style="color:#16a34a;">${data.totalAprovados}</div></div>
  <div class="card"><div class="lbl">Recusados</div><div class="val" style="color:#dc2626;">${data.totalRecusados}</div></div>
</div></div>

<div class="section"><h2>Detalhamento Financeiro</h2>
<div class="summary">
  <div class="srow"><span style="color:#64748b;">Receitas pagas</span><span style="font-weight:700;color:#16a34a;">${BRL(data.totalReceita)}</span></div>
  <div class="srow"><span style="color:#64748b;">Despesas pagas</span><span style="font-weight:700;color:#dc2626;">${BRL(data.totalDespesa)}</span></div>
  <div class="srow" style="background:#f8fafc;"><span style="font-weight:600;">Lucro Líquido</span><span style="font-weight:800;color:${lucroLocal >= 0 ? "#1d4ed8" : "#dc2626"};">${BRL(lucroLocal)}</span></div>
  <div class="srow"><span style="color:#64748b;">Receitas pendentes</span><span style="font-weight:700;color:#d97706;">${BRL(data.totalPendente)}</span></div>
  <div class="srow"><span style="color:#64748b;">Taxa de conversão</span><span style="font-weight:700;">${data.taxaConversao}%</span></div>
</div></div>

<div class="section"><h2>Orçamentos por Status</h2>
<table><thead><tr><th>Status</th><th style="text-align:right;">Qtd</th><th style="text-align:right;">Participação</th></tr></thead><tbody>
${data.quotesChart.map(q => `<tr><td>${statusLabels[q.status] ?? q.status}</td><td style="text-align:right;font-weight:600;">${q.count}</td><td style="text-align:right;color:#64748b;">${data.totalQuotes > 0 ? Math.round((q.count / data.totalQuotes) * 100) : 0}%</td></tr>`).join("")}
</tbody></table></div>

<div class="two-col">
<div><h2>Top Clientes — Receita</h2><div class="bar-list">${data.topClientsByRevenue.map(c => `<div class="bar-item"><span class="bar-name">${c.name}</span>${bar(c.total, maxRevenue, "#1d4ed8")}</div>`).join("")}</div></div>
<div><h2>Top Clientes — Serviços</h2><div class="bar-list">${data.topClientsByOrders.map(c => `<div class="bar-item"><span class="bar-name">${c.name}</span>${barCount(c.count, maxOrders, "#0891b2")}</div>`).join("")}</div></div>
</div>

${data.topServices.length > 0 ? `<div class="section"><h2>Serviços Mais Realizados</h2>
<table><thead><tr><th>#</th><th>Serviço</th><th style="text-align:right;">Qtd</th><th style="text-align:right;">Receita</th></tr></thead><tbody>
${data.topServices.map((s, i) => `<tr><td style="color:#94a3b8;">${i + 1}</td><td style="font-weight:500;">${s.name}</td><td style="text-align:right;">${Math.round(s.count)}x</td><td style="text-align:right;font-weight:600;color:#16a34a;">${BRL(s.revenue)}</td></tr>`).join("")}
</tbody></table></div>` : ""}

${data.rejectedQuotes.length > 0 ? `<div class="section"><h2>Orçamentos Recusados com Motivo</h2>
<table><thead><tr><th>Nº</th><th>Título</th><th style="text-align:right;">Valor</th><th>Motivo</th></tr></thead><tbody>
${data.rejectedQuotes.map(q => `<tr><td style="color:#94a3b8;">#${String(q.number).padStart(4, "0")}</td><td>${q.title}</td><td style="text-align:right;font-weight:600;">${BRL(Number(q.total))}</td><td style="color:#64748b;">${q.rejectionReason ?? "—"}</td></tr>`).join("")}
</tbody></table></div>` : ""}

<div class="footer"><span>Relatório gerado via Elevanthe CRM</span><span>${today} — ${periodLabel}</span></div>
</body></html>`

    // Gera em nova janela e dispara impressão — sem depender de sessão na rota de API
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 400)
    } else {
      // Fallback: blob URL para navegadores que bloqueiam window.open
      const blob = new Blob([html], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `relatorio-${data.periodDays}dias.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
  }

  const summaryCards = [
    { label: "Receita (Entradas)", value: formatCurrencyFull(data.totalReceita), icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
    { label: "Despesas (Saidas)", value: formatCurrencyFull(data.totalDespesa), icon: DollarSign, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    { label: "Lucro Líquido", value: formatCurrencyFull(lucro), icon: TrendingUp, color: lucro >= 0 ? "text-emerald-500" : "text-red-500", bg: lucro >= 0 ? "bg-emerald-500/10" : "bg-red-500/10", border: lucro >= 0 ? "border-emerald-500/20" : "border-red-500/20" },
    { label: "A Receber", value: formatCurrencyFull(data.totalPendente), icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: "Total de Clientes", value: String(data.totalClients), icon: UsersRound, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Total de Orçamentos", value: String(data.totalQuotes), icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { label: "Orçamentos Aprovados", value: String(data.totalAprovados), icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
    { label: "Orçamentos Reprovados", value: String(data.totalRecusados), icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  ]

  return (
    <>
      {/* Print styles — layout profissional A4 */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; font-family: Arial, sans-serif; }
          .print-page { background: white !important; color: #111 !important; padding: 0 !important; }
          .print-card {
            border: 1px solid #e5e7eb !important;
            background: white !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
          .print-text { color: #111827 !important; }
          .print-muted { color: #6b7280 !important; }
          .print-green { color: #16a34a !important; }
          .print-red { color: #dc2626 !important; }
          .print-blue { color: #2563eb !important; }
          .print-amber { color: #d97706 !important; }
          .print-header {
            background: #1e293b !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-green-bg {
            background: #f0fdf4 !important;
            border: 1px solid #bbf7d0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-red-bg {
            background: #fef2f2 !important;
            border: 1px solid #fecaca !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-blue-bg {
            background: #eff6ff !important;
            border: 1px solid #bfdbfe !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-summary-card {
            border: 1px solid #e5e7eb !important;
            background: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>

      <div className="flex flex-col gap-6 print-page">

        {/* Cabeçalho de impressão — visível só no PDF */}
        <div className="hidden print:block print-header rounded-xl p-6 mb-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white">Relatório Financeiro</h1>
              <p className="text-slate-300 text-sm mt-1">Período: últimos {data.periodDays} dias — {dataAtual}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-300 text-xs">Elevanthe CRM</p>
              <p className="text-slate-400 text-xs mt-0.5">Gerado em {dataAtual}</p>
            </div>
          </div>
        </div>

        {/* Header da tela */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground text-sm mt-1">Visão consolidada — {dataAtual}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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

        {/* Seletor de período */}
        <div className="flex items-center gap-2 flex-wrap no-print">
          <Calendar className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground mr-1">Período:</span>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => handlePeriodChange(opt.days)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                data.periodDays === opt.days
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Período selecionado — aparece no PDF */}
        <div className="hidden print:flex items-center gap-2 text-sm text-slate-600 mb-2">
          <Calendar className="size-4" />
          <span>Exibindo dados dos últimos <strong>{data.periodDays} dias</strong> ({periodLabel})</span>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summaryCards.map((card) => (
            <Card key={card.label} className={`bg-card border-border print-summary-card`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`rounded-lg p-2 ${card.bg} border ${card.border} shrink-0 no-print`}>
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

        {/* Resumo financeiro detalhado */}
        <Card className="bg-card border-border print-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground print-text">Resumo Financeiro — Últimos {data.periodDays} dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-green-500/10 border border-green-500/20 print-green-bg">
                <p className="text-xs text-green-500 uppercase tracking-wide font-medium print-green">Receita (Entradas)</p>
                <p className="text-2xl font-bold text-green-500 print-green">{formatCurrencyFull(data.totalReceita)}</p>
                <p className="text-xs text-muted-foreground print-muted">Transações pagas no período</p>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-red-500/10 border border-red-500/20 print-red-bg">
                <p className="text-xs text-red-500 uppercase tracking-wide font-medium print-red">Despesas (Saidas)</p>
                <p className="text-2xl font-bold text-red-500 print-red">{formatCurrencyFull(data.totalDespesa)}</p>
                <p className="text-xs text-muted-foreground print-muted">Despesas pagas no período</p>
              </div>
              <div className={`flex flex-col gap-1 p-4 rounded-xl ${lucro >= 0 ? "bg-emerald-500/10 border-emerald-500/20 print-green-bg" : "bg-red-500/10 border-red-500/20 print-red-bg"} border`}>
                <p className={`text-xs uppercase tracking-wide font-medium ${lucro >= 0 ? "text-emerald-500 print-green" : "text-red-500 print-red"}`}>Lucro Líquido</p>
                <p className={`text-2xl font-bold ${lucro >= 0 ? "text-emerald-500 print-green" : "text-red-500 print-red"}`}>{formatCurrencyFull(lucro)}</p>
                <p className="text-xs text-muted-foreground print-muted">Receita menos Despesas</p>
              </div>
            </div>

            {/* A receber */}
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex justify-between items-center">
              <div>
                <p className="text-xs text-amber-500 uppercase tracking-wide font-medium print-amber">A Receber (Pendente)</p>
                <p className="text-sm text-muted-foreground print-muted mt-0.5">Receitas ainda não pagas (todos os períodos)</p>
              </div>
              <p className="text-xl font-bold text-amber-500 print-amber">{formatCurrencyFull(data.totalPendente)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          <Card className="bg-card border-border print-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground print-text">Status dos Orçamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {data.quotesChart.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  Nenhum orçamento no período
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
                      formatter={(value, name) => [value, STATUS_LABELS[String(name)] ?? String(name)]}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                    <Legend formatter={(value) => STATUS_LABELS[value] ?? value} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Taxa de conversão */}
        <Card className="bg-card border-border print-card">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide print-muted">Taxa de Conversão de Orçamentos</p>
                <p className="text-4xl font-bold text-primary mt-1">{data.taxaConversao}%</p>
                <p className="text-sm text-muted-foreground mt-1 print-muted">
                  {data.totalAprovados} aprovados · {data.totalRecusados} reprovados · {data.totalQuotes} total no período
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

        {/* Top clientes por receita e por serviços */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clientes que mais geraram receita */}
          <Card className="bg-card border-border print-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-amber-500" />
                <CardTitle className="text-base font-semibold text-foreground print-text">Clientes que mais trouxeram receita</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {data.topClientsByRevenue.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma receita no período</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.topClientsByRevenue.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-sm font-medium text-foreground truncate print-text">{c.name}</span>
                          <span className="text-sm font-bold text-green-500 print-green ml-2 shrink-0">{formatCurrencyFull(c.total)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${Math.min(100, (c.total / (data.topClientsByRevenue[0]?.total || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clientes que mais fizeram serviços */}
          <Card className="bg-card border-border print-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <UsersRound className="size-4 text-blue-500" />
                <CardTitle className="text-base font-semibold text-foreground print-text">Clientes com mais ordens de serviço</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {data.topClientsByOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma OS no período</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.topClientsByOrders.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-sm font-medium text-foreground truncate print-text">{c.name}</span>
                          <span className="text-sm font-bold text-blue-500 print-blue ml-2 shrink-0">{c.count} OS</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, (c.count / (data.topClientsByOrders[0]?.count || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Serviços mais realizados */}
        <Card className="bg-card border-border print-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="size-4 text-violet-500" />
              <CardTitle className="text-base font-semibold text-foreground print-text">Serviços mais realizados no período</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.topServices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum serviço registrado no período</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium print-muted">#</th>
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium print-muted">Serviço</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium print-muted">Qtd</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium print-muted">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topServices.map((s, i) => (
                      <tr key={s.name} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 text-muted-foreground text-xs print-muted">#{i + 1}</td>
                        <td className="py-2.5 font-medium text-foreground print-text">{s.name}</td>
                        <td className="py-2.5 text-right text-foreground print-text">{Math.round(s.count)}x</td>
                        <td className="py-2.5 text-right font-bold text-green-500 print-green">{formatCurrencyFull(s.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orçamentos reprovados com motivo */}
        {data.rejectedQuotes.length > 0 && (
          <Card className="bg-card border-border print-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-red-500" />
                <CardTitle className="text-base font-semibold text-foreground print-text">
                  Orçamentos Reprovados — Motivos ({data.rejectedQuotes.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {data.rejectedQuotes.map((q) => (
                  <div key={q.number} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-red-500 print-red">#{String(q.number).padStart(4, "0")}</span>
                      <XCircle className="size-3.5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate print-text">{q.title}</p>
                      {q.rejectionReason ? (
                        <p className="text-xs text-muted-foreground mt-0.5 print-muted">Motivo: {q.rejectionReason}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5 print-muted italic">Motivo não informado</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-red-500 print-red shrink-0">
                      {formatCurrencyFull(Number(q.total))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rodapé no PDF */}
        <div className="hidden print:flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-200 mt-2">
          <span>Elevanthe CRM — Relatório Financeiro</span>
          <span>Gerado em {dataAtual} · Período: {data.periodDays} dias</span>
        </div>

      </div>
    </>
  )
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getReportData } from "@/lib/actions"
import { db } from "@/lib/db"
import { businessProfile } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

const PCT = (v: number) => `${v}%`

function bar(value: number, max: number, color: string): string {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return `<div style="display:flex;align-items:center;gap:8px;">
    <div style="flex:1;height:10px;background:#f1f5f9;border-radius:5px;overflow:hidden;">
      <div style="width:${pct}%;height:100%;background:${color};border-radius:5px;"></div>
    </div>
    <span style="font-size:12px;color:#64748b;min-width:80px;text-align:right;">${BRL(value)}</span>
  </div>`
}

function barCount(value: number, max: number, color: string): string {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return `<div style="display:flex;align-items:center;gap:8px;">
    <div style="flex:1;height:10px;background:#f1f5f9;border-radius:5px;overflow:hidden;">
      <div style="width:${pct}%;height:100%;background:${color};border-radius:5px;"></div>
    </div>
    <span style="font-size:12px;color:#64748b;min-width:40px;text-align:right;">${value}x</span>
  </div>`
}

function monthlyBarsSVG(data: Array<{ month: string; receita: number; despesa: number }>): string {
  const maxVal = Math.max(...data.flatMap(d => [d.receita, d.despesa]), 1)
  const W = 520
  const H = 160
  const barW = 28
  const gap = 8
  const groupW = barW * 2 + gap + 16
  const padL = 60
  const padB = 30

  const bars = data.map((d, i) => {
    const x = padL + i * groupW
    const rh = Math.round((d.receita / maxVal) * (H - padB - 10))
    const dh = Math.round((d.despesa / maxVal) * (H - padB - 10))
    const ry = H - padB - rh
    const dy = H - padB - dh
    return `
      <rect x="${x}" y="${ry}" width="${barW}" height="${rh}" fill="#16a34a" rx="3"/>
      <rect x="${x + barW + gap}" y="${dy}" width="${barW}" height="${dh}" fill="#dc2626" rx="3"/>
      <text x="${x + barW}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#94a3b8">${d.month}</text>
    `
  }).join("")

  // Y axis labels
  const steps = [0, 0.25, 0.5, 0.75, 1.0]
  const yLabels = steps.map(s => {
    const val = maxVal * s
    const y = H - padB - Math.round(s * (H - padB - 10))
    const label = val >= 1000 ? `R$${(val / 1000).toFixed(1)}k` : `R$${val.toFixed(0)}`
    return `<text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="9" fill="#cbd5e1">${label}</text>
    <line x1="${padL}" y1="${y}" x2="${W}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>`
  }).join("")

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${yLabels}
    ${bars}
    <line x1="${padL}" y1="0" x2="${padL}" y2="${H - padB}" stroke="#e2e8f0" stroke-width="1"/>
    <line x1="${padL}" y1="${H - padB}" x2="${W}" y2="${H - padB}" stroke="#e2e8f0" stroke-width="1"/>
  </svg>`
}

export async function GET(req: NextRequest) {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session?.user) {
    return new NextResponse("Não autorizado", { status: 401 })
  }

  const daysParam = req.nextUrl.searchParams.get("days")
  const days = daysParam ? parseInt(daysParam, 10) : 30

  const [data, profileRows] = await Promise.all([
    getReportData(days),
    db.select({ name: businessProfile.name }).from(businessProfile).where(eq(businessProfile.userId, session.user.id)).limit(1),
  ])

  const companyName = profileRows[0]?.name || session.user.name
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const lucro = data.totalReceita - data.totalDespesa
  const periodoLabel = days === 1 ? "Hoje" : days === 7 ? "Últimos 7 dias" : days === 15 ? "Últimos 15 dias" : days === 30 ? "Últimos 30 dias" : days === 90 ? "Últimos 90 dias" : days === 180 ? "Últimos 6 meses" : `Últimos ${days} dias`

  const maxRevenue = Math.max(...data.topClientsByRevenue.map(c => c.total), 1)
  const maxOrders = Math.max(...data.topClientsByOrders.map(c => c.count), 1)
  const maxSvc = Math.max(...data.topServices.map(s => s.count), 1)

  const statusLabels: Record<string, string> = {
    aprovado: "Aprovado",
    recusado: "Recusado",
    enviado: "Enviado",
    rascunho: "Rascunho",
    expirado: "Expirado",
    cancelado: "Cancelado",
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Relatório Analítico — ${companyName}</title>
  <style>
    @page { size: A4; margin: 20mm 18mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; background: #fff; font-size: 13px; line-height: 1.5; }
    h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
    h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
    h3 { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px; }
    .page-break { page-break-before: always; }

    /* Header */
    .report-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 16px; border-bottom: 2px solid #1d4ed8; margin-bottom: 28px; }
    .report-header .brand { font-size: 11px; color: #64748b; text-align: right; }
    .report-header .brand strong { display: block; font-size: 16px; font-weight: 700; color: #1d4ed8; }
    .period-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 4px; border: 1px solid #bfdbfe; }

    /* Cards */
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .card .label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
    .card .value { font-size: 18px; font-weight: 800; color: #0f172a; }
    .card.green .value { color: #16a34a; }
    .card.red .value { color: #dc2626; }
    .card.blue .value { color: #1d4ed8; }
    .card.amber .value { color: #d97706; }

    /* Section */
    .section { margin-bottom: 28px; }

    /* Summary table */
    .summary { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid #f1f5f9; }
    .summary-row:last-child { border-bottom: none; }
    .summary-row .lbl { font-size: 12px; color: #64748b; }
    .summary-row .val { font-size: 13px; font-weight: 700; color: #0f172a; }
    .summary-row.highlight { background: #f8fafc; }
    .summary-row.highlight .val { font-size: 15px; color: #1d4ed8; }

    /* Table */
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #f8fafc; }
    th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #374151; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-gray { background: #f1f5f9; color: #64748b; }

    /* Bar list */
    .bar-list { display: flex; flex-direction: column; gap: 10px; }
    .bar-item { display: flex; flex-direction: column; gap: 4px; }
    .bar-name { font-size: 12px; color: #374151; font-weight: 500; }

    /* Legend */
    .legend { display: flex; gap: 16px; margin-bottom: 10px; }
    .legend-item { display: flex; align-items: center; gap-6px; font-size: 11px; color: #64748b; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 5px; }

    /* Footer */
    .report-footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }

    /* Two-col layout */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- Print button (hidden on print) -->
  <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;">
    <button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
      Imprimir / Salvar PDF
    </button>
  </div>

  <!-- Report Header -->
  <div class="report-header">
    <div>
      <span class="period-badge">${periodoLabel}</span>
      <h1>Relatório Analítico</h1>
      <p style="font-size:12px;color:#64748b;margin-top:4px;">Gerado em ${today}</p>
    </div>
    <div class="brand">
      <strong>${companyName}</strong>
      via Elevanthe CRM
    </div>
  </div>

  <!-- KPI Cards -->
  <div class="section">
    <h2>Resumo do Período</h2>
    <div class="cards">
      <div class="card green">
        <div class="label">Receita (Entradas)</div>
        <div class="value">${BRL(data.totalReceita)}</div>
      </div>
      <div class="card red">
        <div class="label">Despesas (Saídas)</div>
        <div class="value">${BRL(data.totalDespesa)}</div>
      </div>
      <div class="card ${lucro >= 0 ? "blue" : "red"}">
        <div class="label">Lucro Líquido</div>
        <div class="value">${BRL(lucro)}</div>
      </div>
      <div class="card amber">
        <div class="label">A Receber (Pendente)</div>
        <div class="value">${BRL(data.totalPendente)}</div>
      </div>
    </div>

    <div class="cards" style="grid-template-columns:repeat(4,1fr);">
      <div class="card">
        <div class="label">Total de Clientes</div>
        <div class="value">${data.totalClients}</div>
      </div>
      <div class="card">
        <div class="label">Orçamentos no Período</div>
        <div class="value">${data.totalQuotes}</div>
      </div>
      <div class="card green">
        <div class="label">Orçamentos Aprovados</div>
        <div class="value">${data.totalAprovados}</div>
      </div>
      <div class="card red">
        <div class="label">Orçamentos Recusados</div>
        <div class="value">${data.totalRecusados}</div>
      </div>
    </div>
  </div>

  <!-- Financial Summary -->
  <div class="section">
    <h2>Detalhamento Financeiro</h2>
    <div class="summary">
      <div class="summary-row">
        <span class="lbl">Receitas pagas no período</span>
        <span class="val" style="color:#16a34a;">${BRL(data.totalReceita)}</span>
      </div>
      <div class="summary-row">
        <span class="lbl">Despesas pagas no período</span>
        <span class="val" style="color:#dc2626;">${BRL(data.totalDespesa)}</span>
      </div>
      <div class="summary-row highlight">
        <span class="lbl" style="font-weight:600;">Lucro Líquido</span>
        <span class="val" style="color:${lucro >= 0 ? "#1d4ed8" : "#dc2626"};">${BRL(lucro)}</span>
      </div>
      <div class="summary-row">
        <span class="lbl">Receitas pendentes (todos os períodos)</span>
        <span class="val" style="color:#d97706;">${BRL(data.totalPendente)}</span>
      </div>
      <div class="summary-row">
        <span class="lbl">Taxa de conversão de orçamentos</span>
        <span class="val">${PCT(data.taxaConversao)}</span>
      </div>
    </div>
  </div>

  <!-- Receita x Despesa Chart -->
  <div class="section">
    <h2>Receita × Despesa — Últimos 6 Meses</h2>
    <div class="legend">
      <span class="legend-item"><span class="legend-dot" style="background:#16a34a;"></span>Receita</span>
      <span class="legend-item"><span class="legend-dot" style="background:#dc2626;"></span>Despesa</span>
    </div>
    <div style="overflow:hidden;">${monthlyBarsSVG(data.monthlyChart)}</div>
    <table style="margin-top:12px;">
      <thead>
        <tr>
          <th>Mês</th>
          <th style="text-align:right;">Receita</th>
          <th style="text-align:right;">Despesa</th>
          <th style="text-align:right;">Saldo</th>
        </tr>
      </thead>
      <tbody>
        ${data.monthlyChart.map(m => `<tr>
          <td>${m.month}</td>
          <td style="text-align:right;color:#16a34a;font-weight:600;">${BRL(m.receita)}</td>
          <td style="text-align:right;color:#dc2626;font-weight:600;">${BRL(m.despesa)}</td>
          <td style="text-align:right;font-weight:700;color:${m.receita - m.despesa >= 0 ? "#1d4ed8" : "#dc2626"};">${BRL(m.receita - m.despesa)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>

  <!-- Orçamentos por Status -->
  <div class="section">
    <h2>Orçamentos por Status — ${periodoLabel}</h2>
    <table>
      <thead><tr><th>Status</th><th style="text-align:right;">Quantidade</th><th style="text-align:right;">Participação</th></tr></thead>
      <tbody>
        ${data.quotesChart.map(q => `<tr>
          <td><span class="badge ${q.status === "aprovado" ? "badge-green" : q.status === "recusado" ? "badge-red" : q.status === "enviado" ? "badge-blue" : "badge-gray"}">${statusLabels[q.status] ?? q.status}</span></td>
          <td style="text-align:right;font-weight:600;">${q.count}</td>
          <td style="text-align:right;color:#64748b;">${data.totalQuotes > 0 ? Math.round((q.count / data.totalQuotes) * 100) : 0}%</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>

  <!-- Top Clientes -->
  <div class="two-col">
    <div>
      <h2>Top Clientes — Por Receita</h2>
      ${data.topClientsByRevenue.length === 0
        ? `<p style="color:#94a3b8;font-size:12px;">Nenhum dado no período.</p>`
        : `<div class="bar-list">
          ${data.topClientsByRevenue.map(c => `<div class="bar-item">
            <span class="bar-name">${c.name}</span>
            ${bar(c.total, maxRevenue, "#1d4ed8")}
          </div>`).join("")}
        </div>`}
    </div>
    <div>
      <h2>Top Clientes — Por Serviços</h2>
      ${data.topClientsByOrders.length === 0
        ? `<p style="color:#94a3b8;font-size:12px;">Nenhum dado no período.</p>`
        : `<div class="bar-list">
          ${data.topClientsByOrders.map(c => `<div class="bar-item">
            <span class="bar-name">${c.name}</span>
            ${barCount(c.count, maxOrders, "#0891b2")}
          </div>`).join("")}
        </div>`}
    </div>
  </div>

  <!-- Top Serviços -->
  <div class="section">
    <h2>Serviços Mais Realizados — ${periodoLabel}</h2>
    ${data.topServices.length === 0
      ? `<p style="color:#94a3b8;font-size:12px;">Nenhum dado no período.</p>`
      : `<table>
        <thead><tr><th>#</th><th>Serviço / Descrição</th><th style="text-align:right;">Qtd. Realizada</th><th style="text-align:right;">Receita Gerada</th></tr></thead>
        <tbody>
          ${data.topServices.map((s, i) => `<tr>
            <td style="color:#94a3b8;">${i + 1}</td>
            <td style="font-weight:500;">${s.name}</td>
            <td style="text-align:right;">${Math.round(s.count)}x</td>
            <td style="text-align:right;font-weight:600;color:#16a34a;">${BRL(s.revenue)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`}
  </div>

  <!-- Orçamentos Recusados -->
  ${data.rejectedQuotes.length > 0 ? `
  <div class="section">
    <h2>Orçamentos Recusados com Motivo — ${periodoLabel}</h2>
    <table>
      <thead><tr><th>Nº</th><th>Título</th><th style="text-align:right;">Valor</th><th>Motivo Informado</th></tr></thead>
      <tbody>
        ${data.rejectedQuotes.map(q => `<tr>
          <td style="color:#94a3b8;">#${String(q.number).padStart(4, "0")}</td>
          <td>${q.title}</td>
          <td style="text-align:right;font-weight:600;">${BRL(Number(q.total))}</td>
          <td style="color:#64748b;">${q.rejectionReason ?? "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <!-- Footer -->
  <div class="report-footer">
    <span>Relatório gerado por <strong>${companyName}</strong> via Elevanthe CRM</span>
    <span>${today} — ${periodoLabel}</span>
  </div>

</body>
</html>`

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}

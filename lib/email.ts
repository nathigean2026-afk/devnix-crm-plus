import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM_EMAIL = "Elevanthe CRM <no-reply@elevanthe.com>"

const BRL = (v: number | string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v))

const dateFmt = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

type QuoteResponseEmailParams = {
  to: string
  providerName?: string | null
  clientName: string
  quoteNumber: number
  quoteTitle: string
  total: string | number
  decision: "aprovado" | "recusado"
  rejectionReason?: string | null
  respondedAt: Date
}

/**
 * Envia e-mail ao prestador quando um cliente aprova ou recusa um orçamento.
 * Falha silenciosamente (loga) para não quebrar o fluxo de resposta do cliente.
 */
export async function sendQuoteResponseEmail(params: QuoteResponseEmailParams): Promise<boolean> {
  if (!resend) {
    console.warn("[v0] RESEND_API_KEY não configurada — e-mail não enviado.")
    return false
  }

  const {
    to,
    providerName,
    clientName,
    quoteNumber,
    quoteTitle,
    total,
    decision,
    rejectionReason,
    respondedAt,
  } = params

  const aprovado = decision === "aprovado"
  const numeroFmt = `#${String(quoteNumber).padStart(4, "0")}`
  const dataFmt = respondedAt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  const accent = aprovado ? "#16a34a" : "#dc2626"
  const statusLabel = aprovado ? "APROVADO" : "RECUSADO"
  const subject = aprovado
    ? `Orçamento ${numeroFmt} aprovado por ${clientName}`
    : `Orçamento ${numeroFmt} recusado por ${clientName}`

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 13px; letter-spacing: 1px; color: #64748b; text-transform: uppercase;">Elevanthe CRM</span>
    </div>
    <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: ${accent}; color: #ffffff; padding: 16px 24px; font-size: 18px; font-weight: 700;">
        Orçamento ${statusLabel}
      </div>
      <div style="padding: 24px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Olá${providerName ? ` ${providerName}` : ""},</p>
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.5;">
          O cliente <strong>${clientName}</strong> ${aprovado ? "aprovou" : "recusou"} o seu orçamento.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #64748b;">Número</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${numeroFmt}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Título</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${quoteTitle}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Valor</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: ${accent};">${BRL(total)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Respondido em</td><td style="padding: 6px 0; text-align: right;">${dataFmt}</td></tr>
        </table>
        ${
          !aprovado && rejectionReason
            ? `<div style="margin-top: 16px; padding: 12px 16px; background: #fef2f2; border-left: 3px solid ${accent}; border-radius: 6px;">
                 <strong style="display:block; font-size: 13px; color: ${accent}; margin-bottom: 4px;">Motivo da recusa</strong>
                 <span style="font-size: 14px; color: #334155;">${rejectionReason}</span>
               </div>`
            : ""
        }
        ${
          aprovado
            ? `<p style="margin: 20px 0 0; font-size: 14px; color: #16a34a; font-weight: 600;">✓ Uma ordem de serviço foi gerada automaticamente.</p>`
            : ""
        }
      </div>
    </div>
    <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
      Notificação automática do Elevanthe CRM
    </p>
  </div>`

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })
    if (error) {
      console.error("[v0] Erro ao enviar e-mail (Resend):", error)
      return false
    }
    return true
  } catch (e) {
    console.error("[v0] Exceção ao enviar e-mail:", e)
    return false
  }
}

// ─── Email de confirmação de compra ───────────────────────────────────────────

type PurchaseConfirmationEmailParams = {
  to: string
  userName: string
  planName: string     // ex: "Business"
  planId: string       // ex: "30d"
  amountCents: number  // ex: 3000
  durationDays: number // ex: 30
  purchasedAt: Date
  expiresAt: Date
}

const PLAN_FEATURES: Record<string, string[]> = {
  "7d": [
    "Clientes ilimitados",
    "Ordens de Servico ilimitadas",
    "Orcamentos com link publico",
    "Financeiro: receitas e despesas",
    "Relatorios e graficos",
    "Tickets de suporte",
    "Pagamento via Pix",
  ],
  "30d": [
    "Tudo do plano Start",
    "Marca propria nos documentos (logo, CNPJ)",
    "Cor de destaque personalizada",
    "Notificacoes quando orcamento e respondido",
    "Suporte prioritario",
  ],
  "1y": [
    "Tudo do plano Business",
    "1 funcionario auxiliar incluso",
    "Permissoes granulares por modulo",
    "360 dias de acesso completo",
    "Suporte VIP",
  ],
}

const PLAN_LABELS: Record<string, string> = {
  "7d": "Start",
  "30d": "Business",
  "1y": "Enterprise",
}

export async function sendPurchaseConfirmationEmail(
  params: PurchaseConfirmationEmailParams,
): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY nao configurada — e-mail de compra nao enviado.")
    return false
  }

  const { to, userName, planId, amountCents, purchasedAt, expiresAt } = params
  const planLabel = PLAN_LABELS[planId] ?? params.planName
  const features = PLAN_FEATURES[planId] ?? []
  const amount = BRL(amountCents / 100)
  const compraData = dateFmt(purchasedAt)
  const expiracaoData = dateFmt(expiresAt)
  const subject = `Sua licenca ${planLabel} foi ativada — Elevanthe CRM`

  const featureRows = features
    .map(
      (f) => `
      <tr>
        <td style="padding: 7px 0; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9;">
          <span style="display:inline-block; width:20px; color:#2563eb; font-weight:700;">&#10003;</span>
          ${f}
        </td>
      </tr>`,
    )
    .join("")

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

  <div style="max-width:560px; margin:32px auto; padding:0 16px 32px;">

    <!-- Header com logo -->
    <div style="text-align:center; padding: 32px 0 24px;">
      <img
        src="https://crm.elevanthe.com/elevanthe-logo-transparent-dark.png"
        alt="Elevanthe CRM"
        width="200"
        style="display:inline-block; max-width:200px;"
      />
    </div>

    <!-- Card principal -->
    <div style="background:#0f172a; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.15);">

      <!-- Banner de sucesso -->
      <div style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%); padding: 28px 32px; text-align:center;">
        <div style="width:56px; height:56px; background:rgba(255,255,255,0.15); border-radius:50%; margin:0 auto 12px; display:flex; align-items:center; justify-content:center;">
          <span style="font-size:28px; line-height:1;">&#9989;</span>
        </div>
        <h1 style="margin:0; font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.3px;">
          Licenca ativada com sucesso!
        </h1>
        <p style="margin:8px 0 0; font-size:14px; color:rgba(255,255,255,0.75);">
          Plano <strong style="color:#ffffff;">${planLabel}</strong> &mdash; ${amount}
        </p>
      </div>

      <!-- Saudacao -->
      <div style="padding: 28px 32px 0;">
        <p style="margin:0; font-size:15px; color:#e2e8f0; line-height:1.6;">
          Ola, <strong style="color:#ffffff;">${userName}</strong>!
        </p>
        <p style="margin:10px 0 0; font-size:14px; color:#94a3b8; line-height:1.7;">
          Seu pagamento foi confirmado e seu acesso ja esta liberado.
          Aqui estao os detalhes da sua assinatura:
        </p>
      </div>

      <!-- Detalhes da compra -->
      <div style="margin: 20px 32px; background:#1e293b; border-radius:10px; padding: 18px 20px;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <tr>
            <td style="padding:5px 0; color:#64748b;">Plano</td>
            <td style="padding:5px 0; text-align:right; font-weight:700; color:#e2e8f0;">${planLabel}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#64748b;">Valor pago</td>
            <td style="padding:5px 0; text-align:right; font-weight:700; color:#4ade80;">${amount}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#64748b;">Data da compra</td>
            <td style="padding:5px 0; text-align:right; color:#e2e8f0;">${compraData}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#64748b;">Acesso valido ate</td>
            <td style="padding:5px 0; text-align:right; font-weight:700; color:#f8fafc;">${expiracaoData}</td>
          </tr>
        </table>
      </div>

      <!-- Funcionalidades desbloqueadas -->
      <div style="padding: 4px 32px 28px;">
        <p style="margin:0 0 12px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#475569;">
          O que esta incluso no seu plano
        </p>
        <div style="background:#1e293b; border-radius:10px; padding:4px 20px;">
          <table style="width:100%; border-collapse:collapse;">
            ${featureRows}
          </table>
        </div>
      </div>

      <!-- CTA -->
      <div style="padding: 0 32px 32px; text-align:center;">
        <a
          href="https://crm.elevanthe.com/sign-in"
          style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; padding:14px 36px; border-radius:10px; letter-spacing:0.3px;"
        >
          Acessar minha conta agora
        </a>
        <p style="margin:16px 0 0; font-size:12px; color:#475569;">
          Acesse em <a href="https://crm.elevanthe.com" style="color:#3b82f6; text-decoration:none;">crm.elevanthe.com</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:20px 0 0;">
      <p style="margin:0; font-size:11px; color:#94a3b8;">
        Elevanthe CRM &mdash; Gestao de relacionamento que eleva resultados
      </p>
      <p style="margin:4px 0 0; font-size:11px; color:#64748b;">
        Este e-mail foi enviado automaticamente. Nao responda a este endereco.
      </p>
    </div>

  </div>
</body>
</html>`

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })
    if (error) {
      console.error("[email] Erro ao enviar confirmacao de compra:", error)
      return false
    }
    return true
  } catch (e) {
    console.error("[email] Excecao ao enviar confirmacao de compra:", e)
    return false
  }
}

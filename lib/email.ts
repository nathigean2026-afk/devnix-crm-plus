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

  const featureItems = features
    .map(
      (f) => `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #f1f5f9;">
          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="width:28px; vertical-align:middle;">
                <div style="width:22px; height:22px; background:#eff6ff; border-radius:50%; text-align:center; line-height:22px;">
                  <span style="font-size:11px; color:#2563eb; font-weight:900;">&#10003;</span>
                </div>
              </td>
              <td style="font-size:14px; color:#1e293b; font-weight:500; vertical-align:middle; padding-left:4px;">${f}</td>
            </tr>
          </table>
        </td>
      </tr>`,
    )
    .join("")

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">

          <!-- LOGO HEADER — fundo branco, texto azul, sempre visivel -->
          <tr>
            <td align="center" style="padding:32px 0 24px;">
              <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:middle; padding-right:10px;">
                    <!-- Elefante SVG inline — azul vibrante, sempre renderiza -->
                    <img
                      src="https://crm.elevanthe.com/elephant-icon.png"
                      alt=""
                      width="42"
                      height="42"
                      style="display:block; width:42px; height:42px;"
                    />
                  </td>
                  <td style="vertical-align:middle;">
                    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr>
                        <td>
                          <span style="font-size:22px; font-weight:900; color:#1e3a8a; letter-spacing:4px; text-transform:uppercase; font-family:Arial,sans-serif;">ELEVANTHE</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:1px;">
                          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                            <tr>
                              <td style="padding-right:8px;">
                                <span style="font-size:13px; font-weight:800; color:#2563eb; letter-spacing:3px; text-transform:uppercase; font-family:Arial,sans-serif;">CRM</span>
                              </td>
                              <td style="border-left:1px solid #cbd5e1; padding-left:8px;">
                                <span style="font-size:8px; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; font-family:Arial,sans-serif; line-height:1.3; display:block;">GESTAO DE RELACIONAMENTO<br/>QUE ELEVA RESULTADOS</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CARD PRINCIPAL -->
          <tr>
            <td style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(15,23,42,0.08);">

              <!-- BANNER TOPO AZUL -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1e3a8a; padding:36px 40px 32px; text-align:center;">

                    <!-- Icone de sucesso -->
                    <div style="width:60px; height:60px; background:rgba(255,255,255,0.15); border:2px solid rgba(255,255,255,0.3); border-radius:50%; margin:0 auto 16px; text-align:center; line-height:56px;">
                      <span style="font-size:28px; color:#ffffff; display:block; line-height:56px;">&#10003;</span>
                    </div>

                    <h1 style="margin:0 0 8px; font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; line-height:1.2;">
                      Licenca ativada!
                    </h1>
                    <p style="margin:0; font-size:15px; color:rgba(255,255,255,0.75); line-height:1.5;">
                      Seu acesso ao plano <strong style="color:#93c5fd;">${planLabel}</strong> esta liberado
                    </p>
                  </td>
                </tr>
              </table>

              <!-- SAUDACAO -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 40px 0;">
                    <p style="margin:0 0 8px; font-size:17px; font-weight:700; color:#0f172a;">
                      Ola, ${userName}!
                    </p>
                    <p style="margin:0; font-size:14px; color:#64748b; line-height:1.7;">
                      Recebemos a confirmacao do seu pagamento via Pix e sua licenca ja esta ativa.
                      Confira os detalhes abaixo e acesse o sistema quando quiser.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- RESUMO DA COMPRA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 40px 0;">
                    <p style="margin:0 0 12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#94a3b8;">
                      Resumo da compra
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border-radius:12px; overflow:hidden;">
                      <tr>
                        <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px; color:#64748b;">Plano contratado</td>
                              <td align="right" style="font-size:14px; font-weight:700; color:#0f172a;">${planLabel}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px; color:#64748b;">Valor pago</td>
                              <td align="right" style="font-size:16px; font-weight:800; color:#16a34a;">${amount}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px; color:#64748b;">Data da compra</td>
                              <td align="right" style="font-size:13px; font-weight:600; color:#334155;">${compraData}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px; color:#64748b;">Acesso valido ate</td>
                              <td align="right" style="font-size:14px; font-weight:800; color:#1e40af;">${expiracaoData}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- FEATURES DO PLANO -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 40px 0;">
                    <p style="margin:0 0 12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#94a3b8;">
                      O que esta incluso no seu plano
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${featureItems}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- DIVIDER -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 40px 0;">
                    <div style="height:1px; background:#f1f5f9;"></div>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 40px 36px; text-align:center;">
                    <a
                      href="https://crm.elevanthe.com/sign-in"
                      style="display:inline-block; background:#1e40af; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; padding:16px 48px; border-radius:12px; letter-spacing:0.2px;"
                    >
                      Acessar minha conta &rarr;
                    </a>
                    <p style="margin:16px 0 0; font-size:12px; color:#94a3b8;">
                      Ou acesse diretamente em
                      <a href="https://crm.elevanthe.com" style="color:#2563eb; text-decoration:none; font-weight:600;">crm.elevanthe.com</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:28px 0 0;">
              <p style="margin:0 0 4px; font-size:12px; color:#94a3b8; font-weight:500;">
                Elevanthe CRM &mdash; Gestao de relacionamento que eleva resultados
              </p>
              <p style="margin:0; font-size:11px; color:#cbd5e1;">
                Este e-mail foi enviado automaticamente. Por favor, nao responda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

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

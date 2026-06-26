import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const BRL = (v: number | string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v))

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
      <span style="font-size: 13px; letter-spacing: 1px; color: #64748b; text-transform: uppercase;">Devnix CRM Plus</span>
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
      Notificação automática do Devnix CRM Plus
    </p>
  </div>`

  try {
    const { error } = await resend.emails.send({
      from: "Devnix CRM Plus <onboarding@resend.dev>",
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

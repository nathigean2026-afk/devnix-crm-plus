/**
 * Integração com a Wame API para envio de mensagens WhatsApp.
 * Server: https://us.api-wa.me
 * Todas as funções falham silenciosamente — nunca bloqueiam o fluxo principal.
 */

const WAME_SERVER = process.env.WAME_SERVER ?? "https://us.api-wa.me"
const WAME_API_KEY = process.env.WAME_API_KEY
const WAME_INSTANCE_ID = process.env.WAME_INSTANCE_ID

/** Normaliza número: remove não-dígitos, garante DDI 55 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return digits.startsWith("55") ? digits : `55${digits}`
}

/**
 * Envia mensagem de texto via Wame API.
 * Retorna true se enviou com sucesso, false se falhou.
 */
export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  if (!WAME_API_KEY) {
    console.warn("[whatsapp] WAME_API_KEY não configurado.")
    return false
  }

  try {
    const normalized = normalizePhone(phone)
    // Formato confirmado pela documentação: POST /{key}/message/text
    // com body { to: "<número>", text: "<mensagem>" }
    const url = `${WAME_SERVER}/${WAME_API_KEY}/message/text`

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: normalized, text: message }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[whatsapp] Erro ${res.status}: ${body}`)
      return false
    }

    return true
  } catch (err) {
    console.error("[whatsapp] Falha ao enviar mensagem:", err)
    return false
  }
}

// ── Templates de mensagem ─────────────────────────────────────────────────────

export function msgOrcamentoAprovado(opts: {
  clientName: string
  quoteTitle: string
  quoteNumber: number
  total: number
}) {
  const valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(opts.total)
  return (
    `*Elevanthe CRM* ✅\n\n` +
    `*Orcamento aprovado!*\n` +
    `Cliente: ${opts.clientName}\n` +
    `Orcamento: ${opts.quoteTitle} (#${String(opts.quoteNumber).padStart(4, "0")})\n` +
    `Valor: ${valor}\n\n` +
    `Acesse o sistema para acompanhar a Ordem de Servico gerada automaticamente.`
  )
}

export function msgOrcamentoRecusado(opts: {
  clientName: string
  quoteTitle: string
  quoteNumber: number
  rejectionReason?: string | null
}) {
  return (
    `*Elevanthe CRM* ❌\n\n` +
    `*Orcamento recusado*\n` +
    `Cliente: ${opts.clientName}\n` +
    `Orcamento: ${opts.quoteTitle} (#${String(opts.quoteNumber).padStart(4, "0")})\n` +
    (opts.rejectionReason ? `Motivo: ${opts.rejectionReason}\n` : "") +
    `\nAcesse o sistema para mais detalhes.`
  )
}

export function msgPlanoExpirando(opts: { daysLeft: number; providerName: string }) {
  const dias = opts.daysLeft === 1 ? "1 dia" : `${opts.daysLeft} dias`
  return (
    `*Elevanthe CRM* ⚠️\n\n` +
    `Ola, ${opts.providerName}!\n\n` +
    `Seu plano expira em *${dias}*. Renove agora para continuar usando todos os recursos do sistema sem interrupcao.\n\n` +
    `Acesse: https://crm.elevanthe.com/dashboard/configuracoes`
  )
}

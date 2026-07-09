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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crm.elevanthe.com"

/** Envia orçamento para o cliente aprovar/recusar pelo WhatsApp */
export function msgOrcamentoEnviado(opts: {
  clientName: string
  quoteTitle: string
  quoteNumber: number
  total: number
  providerName: string
  quoteId: string
}) {
  const valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(opts.total)
  const link = `${BASE_URL}/orcamento/${opts.quoteId}`
  return (
    `Olá, *${opts.clientName}*! 👋\n\n` +
    `*${opts.providerName}* enviou um orçamento para você:\n\n` +
    `📋 *${opts.quoteTitle}* (#${String(opts.quoteNumber).padStart(4, "0")})\n` +
    `💰 Valor total: *${valor}*\n\n` +
    `Acesse o link abaixo para ver todos os detalhes e *aprovar ou recusar* com um clique:\n` +
    `👉 ${link}\n\n` +
    `_Em caso de dúvidas, responda esta mensagem._`
  )
}

/** Notifica o prestador que um orçamento foi aprovado pelo cliente */
export function msgOrcamentoAprovado(opts: {
  clientName: string
  quoteTitle: string
  quoteNumber: number
  total: number
  quoteId?: string
}) {
  const valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(opts.total)
  const link = opts.quoteId ? `\n\n🔗 ${BASE_URL}/dashboard/orcamentos` : ""
  return (
    `*Elevanthe CRM* ✅\n\n` +
    `*Orçamento aprovado!*\n\n` +
    `👤 Cliente: ${opts.clientName}\n` +
    `📋 Orçamento: ${opts.quoteTitle} (#${String(opts.quoteNumber).padStart(4, "0")})\n` +
    `💰 Valor: ${valor}\n\n` +
    `Uma Ordem de Serviço foi gerada automaticamente no sistema.` +
    link
  )
}

/** Notifica o prestador que um orçamento foi recusado pelo cliente */
export function msgOrcamentoRecusado(opts: {
  clientName: string
  quoteTitle: string
  quoteNumber: number
  rejectionReason?: string | null
}) {
  return (
    `*Elevanthe CRM* ❌\n\n` +
    `*Orçamento recusado*\n\n` +
    `👤 Cliente: ${opts.clientName}\n` +
    `📋 Orçamento: ${opts.quoteTitle} (#${String(opts.quoteNumber).padStart(4, "0")})\n` +
    (opts.rejectionReason ? `💬 Motivo: ${opts.rejectionReason}\n` : "") +
    `\n🔗 ${BASE_URL}/dashboard/orcamentos`
  )
}

/** Alerta ao prestador sobre plano expirando */
export function msgPlanoExpirando(opts: { daysLeft: number; providerName: string }) {
  const dias = opts.daysLeft === 1 ? "1 dia" : `${opts.daysLeft} dias`
  return (
    `*Elevanthe CRM* ⚠️\n\n` +
    `Olá, *${opts.providerName}*!\n\n` +
    `Seu plano expira em *${dias}*. Renove agora para continuar usando todos os recursos sem interrupção.\n\n` +
    `🔗 ${BASE_URL}/dashboard/configuracoes`
  )
}

/** Mensagem diária de aniversariantes para o prestador */
export function msgAniversariantesDiario(opts: {
  providerName: string
  aniversariantes: Array<{ name: string; phone?: string | null }>
}) {
  const { providerName, aniversariantes } = opts
  if (aniversariantes.length === 0) return null

  const lista = aniversariantes
    .map((c, i) => `${i + 1}. ${c.name}${c.phone ? ` — ${c.phone}` : ""}`)
    .join("\n")

  const plural = aniversariantes.length === 1
    ? "1 cliente faz aniversário"
    : `${aniversariantes.length} clientes fazem aniversário`

  return (
    `*Elevanthe CRM* 🎂\n\n` +
    `Bom dia, *${providerName}*!\n\n` +
    `Hoje *${plural}*:\n\n` +
    lista +
    `\n\n💡 Acesse o CRM para enviar mensagens de parabéns!\n` +
    `🔗 ${BASE_URL}/dashboard`
  )
}

/** Mensagem de parabéns do prestador para o cliente aniversariante */
export function msgParabensAniversario(opts: {
  clientName: string
  providerName: string
}) {
  return (
    `🎂 *Feliz Aniversário, ${opts.clientName}!*\n\n` +
    `A equipe da *${opts.providerName}* deseja a você um dia muito especial, cheio de alegria e realizações!\n\n` +
    `Que este novo ano de vida traga muitas conquistas. 🎉`
  )
}

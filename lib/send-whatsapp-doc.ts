/**
 * Utilitário client-side para envio de documentos (recibo, OS, orçamento) via WhatsApp.
 *
 * Fluxo:
 * 1. Tenta enviar via API /api/whatsapp/send-doc (Wame — direto, sem abrir WhatsApp Web)
 *    → requer plano Business/Enterprise + whatsappPhone configurado + Wame disponível
 * 2. Caso a API retorne qualquer erro (plano, config, Wame fora, erro de rede),
 *    faz fallback abrindo WhatsApp Web na nova aba.
 *
 * Retorna:
 *   "api"     → enviou direto via API
 *   "web"     → abriu WhatsApp Web como fallback
 */
export async function sendDocWhatsApp(opts: {
  phone: string    // número do DESTINATÁRIO (cliente)
  message: string  // texto da mensagem
}): Promise<"api" | "web"> {
  const { phone, message } = opts

  try {
    const res = await fetch("/api/whatsapp/send-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.ok) return "api"
    }
  } catch {
    // Ignora erros de rede — cai no fallback
  }

  // Fallback: abre WhatsApp Web
  const digits = phone.replace(/\D/g, "")
  const normalized = digits.startsWith("55") ? digits : `55${digits}`
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
  window.open(url, "_blank")
  return "web"
}

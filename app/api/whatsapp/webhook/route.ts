import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { chatbotSessions, chatbotMessages, businessProfile } from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"
import { sendWhatsApp } from "@/lib/whatsapp"
import { nanoid } from "nanoid"

// ── Normaliza numero para formato 5587... ──────────────────────────────────────
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  return digits.startsWith("55") ? digits : `55${digits}`
}

// ── Verifica se o numero pertence a um prestador cadastrado ───────────────────
async function isPrestador(phone: string): Promise<boolean> {
  const rows = await db
    .select({ id: businessProfile.id })
    .from(businessProfile)
    .where(eq(businessProfile.whatsappPhone, phone))
    .limit(1)
  return rows.length > 0
}

// ── Engine de menu ────────────────────────────────────────────────────────────
// Etapas: welcome → menu → (orcamento | suporte | conhecer | atendente)
async function processMenu(
  step: string,
  incomingText: string,
  phone: string,
  name: string | null
): Promise<{ reply: string; nextStep: string }> {
  const normalized = incomingText.trim().toLowerCase()
  const firstName = name?.split(" ")[0] ?? "Ola"

  // Se o usuario digitar "menu" em qualquer etapa, reinicia
  if (normalized === "menu" || normalized === "0") {
    return buildMenu(firstName)
  }

  switch (step) {
    case "welcome":
    case "menu": {
      return buildMenu(firstName)
    }

    case "awaiting_choice": {
      if (normalized === "1" || normalized.includes("orcamento")) {
        return {
          reply:
            `Certo! Para solicitar um orcamento, entre em contato diretamente com nossa equipe comercial.\n\n` +
            `Nos informe:\n- Seu nome\n- O servico desejado\n- Sua cidade\n\n` +
            `Em breve um de nossos especialistas entrara em contato.\n\n` +
            `Digite *menu* para voltar ao inicio.`,
          nextStep: "done",
        }
      }
      if (normalized === "2" || normalized.includes("suporte") || normalized.includes("tecnic")) {
        return {
          reply:
            `Para suporte tecnico, acesse nosso sistema em:\n` +
            `*https://crm.elevanthe.com*\n\n` +
            `Ou envie um e-mail para: *suporte@elevanthe.com*\n\n` +
            `Horario de atendimento: Seg-Sex, 8h-18h\n\n` +
            `Digite *menu* para voltar ao inicio.`,
          nextStep: "done",
        }
      }
      if (normalized === "3" || normalized.includes("crm") || normalized.includes("conhecer") || normalized.includes("sistema")) {
        return {
          reply:
            `*Elevanthe CRM* e um sistema completo para prestadores de servico:\n\n` +
            `- Gestao de clientes e servicos\n` +
            `- Orcamentos com link de aprovacao\n` +
            `- Ordens de servico e recibos\n` +
            `- Financeiro e relatorios\n` +
            `- Notificacoes via WhatsApp\n\n` +
            `Acesse: *https://crm.elevanthe.com*\n` +
            `Planos a partir de R$ 29,90/mes.\n\n` +
            `Digite *menu* para voltar ao inicio.`,
          nextStep: "done",
        }
      }
      if (normalized === "4" || normalized.includes("atendente") || normalized.includes("humano") || normalized.includes("falar")) {
        return {
          reply:
            `Entendido! Um atendente humano entrara em contato em breve.\n\n` +
            `Horario de atendimento: Seg-Sex, 8h-18h.\n\n` +
            `Se preferir, envie um e-mail para: *contato@elevanthe.com*\n\n` +
            `Digite *menu* para ver as opcoes novamente.`,
          nextStep: "human_requested",
        }
      }
      // Opcao invalida
      return {
        reply:
          `Nao entendi sua escolha. Por favor, responda com o *numero* da opcao desejada:\n\n` +
          `1 - Solicitar orcamento\n` +
          `2 - Suporte tecnico\n` +
          `3 - Conhecer o Elevanthe CRM\n` +
          `4 - Falar com atendente\n\n` +
          `Ou digite *menu* para reiniciar.`,
        nextStep: "awaiting_choice",
      }
    }

    case "done":
    case "human_requested": {
      // Continua aguardando sem resposta automatica (ou reinicia se digitar menu)
      return {
        reply:
          `Obrigado pelo contato! Se precisar de mais algo, digite *menu* para ver as opcoes.`,
        nextStep: step,
      }
    }

    default:
      return buildMenu(firstName)
  }
}

function buildMenu(firstName: string): { reply: string; nextStep: string } {
  return {
    reply:
      `Ola, *${firstName}*! Seja bem-vindo(a) a *Elevanthe Tecnologia*.\n\n` +
      `Como posso te ajudar hoje? Responda com o *numero* da opcao:\n\n` +
      `1 - Solicitar orcamento\n` +
      `2 - Suporte tecnico\n` +
      `3 - Conhecer o Elevanthe CRM\n` +
      `4 - Falar com um atendente\n\n` +
      `_Este e um atendimento automatico._`,
    nextStep: "awaiting_choice",
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ ok: true })

    // Log completo para debugar formato real da Wame
    console.log("[v0] webhook payload completo:", JSON.stringify(body, null, 2))

    // Wame envia eventos de varios tipos — so processa mensagens de texto recebidas
    const event = body.event ?? body.type
    console.log("[v0] event:", event)

    if (event !== "message" && event !== "messages.upsert" && event !== "onmessage") {
      console.log("[v0] evento ignorado:", event)
      return NextResponse.json({ ok: true })
    }

    const data = body.data ?? body
    const rawPhone: string =
      data.from ?? data.key?.remoteJid ?? data.sender ?? data.phone ?? ""
    const incomingText: string =
      data.body ?? data.message?.conversation ?? data.text ?? data.content ?? ""
    const contactName: string | null =
      data.pushName ?? data.notifyName ?? data.name ?? null

    console.log("[v0] phone:", rawPhone, "| text:", incomingText, "| name:", contactName)

    if (!rawPhone || !incomingText) return NextResponse.json({ ok: true })

    // Ignora mensagens enviadas pelo proprio numero (outbound)
    if (data.fromMe === true || data.key?.fromMe === true) {
      return NextResponse.json({ ok: true })
    }

    const phone = normalizePhone(rawPhone)

    // Ignora prestadores cadastrados — eles recebem notificacoes outbound,
    // nao devem cair no fluxo do chatbot
    const skipBot = await isPrestador(phone)
    if (skipBot) return NextResponse.json({ ok: true })

    // Busca ou cria sessao
    let session = await db
      .select()
      .from(chatbotSessions)
      .where(eq(chatbotSessions.phone, phone))
      .limit(1)
      .then(r => r[0] ?? null)

    if (!session) {
      const newId = nanoid()
      await db.insert(chatbotSessions).values({
        id: newId,
        phone,
        name: contactName,
        step: "welcome",
        messageCount: 0,
        humanMode: false,
      })
      session = await db
        .select()
        .from(chatbotSessions)
        .where(eq(chatbotSessions.phone, phone))
        .limit(1)
        .then(r => r[0])
    }

    // Salva mensagem recebida
    await db.insert(chatbotMessages).values({
      id: nanoid(),
      sessionId: session.id,
      direction: "in",
      text: incomingText,
    })

    // Se admin assumiu a conversa em modo humano, nao responde automaticamente
    if (session.humanMode) {
      await db
        .update(chatbotSessions)
        .set({ lastMessage: incomingText, messageCount: (session.messageCount ?? 0) + 1, updatedAt: new Date() })
        .where(eq(chatbotSessions.id, session.id))
      return NextResponse.json({ ok: true })
    }

    // Processa menu
    const { reply, nextStep } = await processMenu(
      session.step,
      incomingText,
      phone,
      contactName ?? session.name
    )

    // Envia resposta
    await sendWhatsApp(phone, reply)

    // Salva mensagem enviada
    await db.insert(chatbotMessages).values({
      id: nanoid(),
      sessionId: session.id,
      direction: "out",
      text: reply,
    })

    // Atualiza sessao
    await db
      .update(chatbotSessions)
      .set({
        step: nextStep,
        lastMessage: incomingText,
        lastReply: reply,
        name: contactName ?? session.name,
        messageCount: (session.messageCount ?? 0) + 1,
        humanMode: nextStep === "human_requested",
        updatedAt: new Date(),
      })
      .where(eq(chatbotSessions.id, session.id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[webhook] Erro:", err)
    return NextResponse.json({ ok: true }) // sempre 200 para o Wame nao retentar
  }
}

// GET para verificacao de saude do webhook
export async function GET() {
  return NextResponse.json({ status: "ok", service: "elevanthe-chatbot" })
}

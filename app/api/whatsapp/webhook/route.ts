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

// ── Busca prestador com chatbot ativo pelo numero da instancia ────────────────
// Usado quando cada prestador tiver instancia propria (Fase 2 completa).
// Com numero compartilhado, retorna null (usa menu da Elevanthe).
async function getPrestadorChatbot(instancePhone: string) {
  // Quando o prestador tiver numero proprio, a instancia dele vai ter um phone diferente.
  // Por enquanto retornamos null (numero compartilhado da Elevanthe).
  return null
}

// ── Engine chatbot do prestador (menu dinamico configurado no CRM) ─────────────
function processMenuPrestador(
  step: string,
  incomingText: string,
  firstName: string,
  config: {
    nome: string
    saudacao: string
    horario: string
    contato: string
    opcoes: Array<{ id: string; titulo: string; resposta: string }>
  }
): { reply: string; nextStep: string } {
  const normalized = incomingText.trim().toLowerCase()
  const { nome, saudacao, horario, contato, opcoes } = config

  const buildPrestadorMenu = () => {
    const linhas = opcoes.map((o, i) => `${i + 1} - ${o.titulo}`).join("\n")
    return {
      reply:
        `Olá, *${firstName}*! ${saudacao}\n\n` +
        `Responda com o *número* da opção:\n\n` +
        linhas +
        `\n\nDigite *menu* para ver as opções novamente.`,
      nextStep: "awaiting_choice",
    }
  }

  if (normalized === "menu" || normalized === "0") return buildPrestadorMenu()

  if (step === "welcome" || step === "menu") return buildPrestadorMenu()

  if (step === "awaiting_choice") {
    const idx = parseInt(normalized) - 1
    const found = opcoes[idx]
    if (found) {
      return {
        reply:
          found.resposta +
          `\n\n_Horário: ${horario || "Seg–Sex, 8h–18h"}_` +
          (contato ? `\nContato: ${contato}` : "") +
          `\n\nDigite *menu* para ver as opções.`,
        nextStep: "done",
      }
    }
    return {
      reply:
        `Não entendi. Responda com o *número* da opção:\n\n` +
        opcoes.map((o, i) => `${i + 1} - ${o.titulo}`).join("\n") +
        `\n\nOu digite *menu* para reiniciar.`,
      nextStep: "awaiting_choice",
    }
  }

  return {
    reply: `Digite *menu* para ver as opções disponíveis.`,
    nextStep: step,
  }
}

// ── Engine de menu ────────────────────────────────────────────────────────────
async function processMenu(
  step: string,
  incomingText: string,
  phone: string,
  name: string | null
): Promise<{ reply: string; nextStep: string }> {
  const normalized = incomingText.trim().toLowerCase()
  const firstName = name?.split(" ")[0] ?? "você"

  // Reinicia em qualquer etapa
  if (normalized === "menu" || normalized === "0" || normalized === "inicio" || normalized === "início") {
    return buildMenu(firstName)
  }

  switch (step) {
    case "welcome":
    case "menu":
      return buildMenu(firstName)

    case "awaiting_choice": {
      // Opção 1 — Orçamento
      if (normalized === "1" || normalized.includes("orçamento") || normalized.includes("orcamento") || normalized.includes("preço")) {
        return {
          reply:
            `✅ *Solicitação de Orçamento*\n\n` +
            `Fico feliz em ajudar! Para enviarmos um orçamento personalizado, precisamos de algumas informações:\n\n` +
            `📋 *Envie nesta mesma conversa:*\n` +
            `• Seu nome completo\n` +
            `• O serviço ou produto desejado\n` +
            `• Sua cidade/estado\n` +
            `• Melhor horário para contato\n\n` +
            `⏱ Nossa equipe comercial retornará em até *2 horas úteis*.\n\n` +
            `_Horário de atendimento: Seg–Sex, 8h–18h_\n\n` +
            `Digite *menu* para voltar ao início.`,
          nextStep: "awaiting_quote_info",
        }
      }

      // Opção 2 — Suporte técnico
      if (normalized === "2" || normalized.includes("suporte") || normalized.includes("técnico") || normalized.includes("tecnico") || normalized.includes("problema")) {
        return {
          reply:
            `🛠 *Suporte Técnico — Elevanthe*\n\n` +
            `Estamos aqui para ajudar! Escolha o canal mais conveniente:\n\n` +
            `💻 *Portal do cliente:*\n` +
            `https://crm.elevanthe.com\n\n` +
            `📧 *E-mail:*\n` +
            `suporte@elevanthe.com\n\n` +
            `📞 *WhatsApp comercial:*\n` +
            `Este mesmo número\n\n` +
            `🕐 *Horário de atendimento:*\n` +
            `Segunda a Sexta, das 8h às 18h\n\n` +
            `Para suporte urgente, descreva seu problema nesta conversa e um especialista assumirá o atendimento.\n\n` +
            `Digite *menu* para voltar ao início.`,
          nextStep: "done",
        }
      }

      // Opção 3 — Conhecer o CRM
      if (normalized === "3" || normalized.includes("crm") || normalized.includes("conhecer") || normalized.includes("sistema") || normalized.includes("plano")) {
        return {
          reply:
            `*Elevanthe CRM — Sistema para Prestadores de Serviço*\n\n` +
            `Tudo que sua empresa precisa em um só lugar:\n\n` +
            `- Clientes, OS e orçamentos ilimitados\n` +
            `- Orçamentos digitais com link de aprovação pelo cliente\n` +
            `- Ordens de serviço e recibos\n` +
            `- Financeiro completo (receitas e despesas)\n` +
            `- Relatórios e gráficos de desempenho\n` +
            `- Catálogo de serviços\n` +
            `- Pagamento via Pix integrado\n` +
            `- Notificações de resposta de orçamento via WhatsApp\n` +
            `- Acesso pelo celular ou computador\n\n` +
            `*Planos disponíveis:*\n\n` +
            `*Start — R$ 7* (pagamento único)\n` +
            `7 dias de acesso completo. Ideal para testar antes de assinar.\n\n` +
            `*Business — R$ 30/mês*\n` +
            `Acesso completo + logo e marca própria nos documentos + notificações + suporte prioritário.\n\n` +
            `*Enterprise — R$ 280/ano* (~R$ 23/mês)\n` +
            `Tudo do Business + 1 funcionário auxiliar incluso + permissões por módulo + suporte VIP.\n\n` +
            `Sem taxa de adesão. Cancele quando quiser.\n\n` +
            `Acesse e crie sua conta: https://crm.elevanthe.com\n\n` +
            `Digite *4* para falar com um consultor ou *menu* para voltar ao início.`,
          nextStep: "done",
        }
      }

      // Opção 4 — Falar com atendente
      if (normalized === "4" || normalized.includes("atendente") || normalized.includes("humano") || normalized.includes("falar") || normalized.includes("consultor")) {
        return {
          reply:
            `👋 *Atendimento Humano*\n\n` +
            `Entendido! Um de nossos atendentes entrará em contato em breve.\n\n` +
            `🕐 *Horário de atendimento:*\n` +
            `Segunda a Sexta, das 8h às 18h\n\n` +
            `📧 *Prefere e-mail?*\n` +
            `contato@elevanthe.com\n\n` +
            `🌐 *Site:*\n` +
            `https://elevanthe.com\n\n` +
            `_Enquanto aguarda, você pode continuar navegando pelo menu._\n\n` +
            `Digite *menu* para ver as opções novamente.`,
          nextStep: "human_requested",
        }
      }

      // Opção 5 — Trabalhe conosco
      if (normalized === "5" || normalized.includes("trabalh") || normalized.includes("vaga") || normalized.includes("emprego") || normalized.includes("parceria")) {
        return {
          reply:
            `🤝 *Trabalhe Conosco / Parcerias*\n\n` +
            `Ficamos felizes com seu interesse!\n\n` +
            `Envie seu currículo ou proposta de parceria para:\n` +
            `📧 contato@elevanthe.com\n\n` +
            `Ou descreva seu interesse nesta conversa e encaminharemos ao setor responsável.\n\n` +
            `Digite *menu* para voltar ao início.`,
          nextStep: "done",
        }
      }

      // Opção inválida
      return {
        reply:
          `⚠️ Não entendi sua escolha.\n\n` +
          `Por favor, responda com o *número* da opção desejada:\n\n` +
          `1 - Solicitar orçamento\n` +
          `2 - Suporte técnico\n` +
          `3 - Conhecer o Elevanthe CRM\n` +
          `4 - Falar com um atendente\n` +
          `5 - Trabalhe conosco / Parcerias\n\n` +
          `Ou digite *menu* para reiniciar.`,
        nextStep: "awaiting_choice",
      }
    }

    case "awaiting_quote_info": {
      // Recebeu as informações do orçamento
      return {
        reply:
          `✅ *Informações recebidas!*\n\n` +
          `Obrigado! Nossa equipe comercial recebeu sua solicitação e entrará em contato em até *2 horas úteis*.\n\n` +
          `_Horário de atendimento: Seg–Sex, 8h–18h_\n\n` +
          `Precisa de mais alguma coisa?\n` +
          `Digite *menu* para ver as opções.`,
        nextStep: "done",
      }
    }

    case "done":
    case "human_requested": {
      return {
        reply:
          `Olá novamente!\n\n` +
          `Posso ajudar com mais alguma coisa?\n\n` +
          `Digite *menu* para ver todas as opções.`,
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
      `Olá, *${firstName}*! Seja bem-vindo(a) à *Elevanthe Tecnologia*.\n\n` +
      `Somos especializados em soluções digitais para prestadores de serviço.\n\n` +
      `Como posso te ajudar? Responda com o *número* da opção:\n\n` +
      `1 - Solicitar orçamento\n` +
      `2 - Suporte técnico\n` +
      `3 - Conhecer o Elevanthe CRM e planos\n` +
      `4 - Falar com um atendente\n` +
      `5 - Trabalhe conosco / Parcerias\n\n` +
      `_Atendimento automático 24h. Para falar com um humano, digite 4._`,
    nextStep: "awaiting_choice",
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ ok: true })

    const data = body.data ?? body

    // Formato real confirmado pela Wame:
    // { instance, type: "message", data: { phoneNumber, msgContent: { conversation }, pushName, me, ... } }
    // Ignora eventos que nao sao mensagens (presence, connection, etc.)
    const type = body.type ?? body.event ?? ""
    if (type !== "message") return NextResponse.json({ ok: true })

    // Ignora mensagens enviadas pelo proprio numero
    const isOutbound = data.me === true || data.fromMe === true || data.key?.fromMe === true
    if (isOutbound) return NextResponse.json({ ok: true })

    // Extrai campos no formato real da Wame
    const rawPhone: string =
      data.phoneNumber ??                          // formato Wame real
      data.from ?? data.sender ?? data.phone ?? ""  // fallbacks

    const incomingText: string =
      data.msgContent?.conversation ??             // formato Wame real
      data.msgContent?.extendedTextMessage?.text ?? // imagem com legenda
      data.body ?? data.text ?? data.message?.conversation ?? ""

    const contactName: string | null =
      data.pushName ?? data.notifyName ?? data.name ?? null

    // Ignora eventos sem telefone ou texto
    if (!rawPhone || !incomingText) return NextResponse.json({ ok: true })

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

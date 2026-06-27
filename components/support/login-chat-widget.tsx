"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, ChevronDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Tipos ────────────────────────────────────────────────────────────────────
type ChatMsg = {
  role: "user" | "bot"
  text: string
  // Mensagem pode ter uma lista de botões de sugestão
  suggestions?: string[]
}

// ─── Base de conhecimento ─────────────────────────────────────────────────────
const FAQ: Array<{ keywords: string[]; answer: string; suggestions?: string[] }> = [
  {
    keywords: ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "oque", "o que", "oq"],
    answer:
      "Olá! Sou o assistente virtual do **Elevanthe CRM**. Posso te ajudar com dúvidas sobre a plataforma, planos, preços e muito mais. O que você gostaria de saber?",
    suggestions: ["Quanto custa?", "O que é o Elevanthe?", "Quais funcionalidades?", "Como funciona o suporte?"],
  },
  {
    keywords: ["preço", "preco", "valor", "custa", "custo", "quanto", "mensalidade", "assinatura", "plano"],
    answer:
      "Temos 3 planos sem assinatura automática — você paga e escolhe quando renovar:\n\n• **Start — R$ 7** — 7 dias (ideal para testar)\n• **Business — R$ 24/mês** — 30 dias, o mais popular\n• **Enterprise — R$ 260/ano** — 12 meses com economia de R$ 28 e 1 funcionário incluso\n\nTodos aceitam **Pix, Cartão de crédito e Boleto** via Mercado Pago.",
    suggestions: ["O que inclui cada plano?", "Tem período grátis?", "Como ativar o plano?"],
  },
  {
    keywords: ["inclui", "recursos", "funcionalidade", "modulo", "módulo", "feature", "tem", "possui"],
    answer:
      "O Elevanthe CRM inclui:\n\n• **Clientes** — cadastro completo com histórico\n• **Orçamentos** — criação rápida, envio por WhatsApp ou link público\n• **Ordens de Serviço** — controle de execução e entrega\n• **Financeiro** — receitas, despesas e saldo\n• **Relatórios** — métricas e gráficos do negócio\n• **Catálogo de Serviços** — preços e descrições padronizados\n• **Pagamento via Pix** — cobranças direto pelo sistema\n• **Notificações WhatsApp** — envio automático para clientes\n• **Controle de Estoque** — itens e quantidades\n• **Assinatura Digital** — documentos online\n• **Multi-usuário** — funcionários com permissões\n• **Personalização** — sua logo, nome e CNPJ",
    suggestions: ["Quanto custa?", "Tem app mobile?", "Funciona para qual tipo de negócio?"],
  },
  {
    keywords: ["gratis", "grátis", "free", "teste", "testar", "trial", "gratuito", "experimentar"],
    answer:
      "Sim! O plano **Start por R$ 7** funciona como um período de teste com acesso completo por 7 dias. É a forma ideal de conhecer tudo antes de escolher o plano mensal ou anual.\n\nCrie sua conta gratuitamente e ative o Start para começar agora.",
    suggestions: ["Criar conta", "Quanto custa o plano mensal?"],
  },
  {
    keywords: ["whatsapp", "notificação", "notificacao", "mensagem", "envio", "enviar"],
    answer:
      "Sim! O Elevanthe envia notificações e orçamentos pelo **WhatsApp** diretamente para seus clientes. Você pode enviar:\n\n• Orçamentos com link de visualização\n• Confirmação de ordens de serviço\n• Lembretes de pagamento\n\nO envio é feito pelo próprio sistema, sem precisar sair da plataforma.",
    suggestions: ["Quais outras funcionalidades?", "Quanto custa?"],
  },
  {
    keywords: ["pix", "pagamento", "cobrar", "cobrança", "boleto", "cartão", "cartao", "receber"],
    answer:
      "O Elevanthe permite cobrar seus clientes de várias formas:\n\n• **Pix** — gere cobranças diretamente no sistema\n• **Boleto e Cartão** — nos planos pagos via Mercado Pago\n• **Link de orçamento público** — cliente visualiza e aprova online\n\nTudo integrado ao financeiro para controle automático das receitas.",
    suggestions: ["Como funciona o financeiro?", "Quais funcionalidades?"],
  },
  {
    keywords: ["funciona", "negócio", "negocio", "tipo", "empresa", "serviço", "servico", "prestador", "loja"],
    answer:
      "O Elevanthe foi criado para **prestadores de serviço e pequenas empresas**. Funciona muito bem para:\n\n• Oficinas e mecânicos\n• Salões de beleza e estética\n• Instaladores e técnicos\n• Designers e freelancers\n• Pequenas lojas com serviços\n• Qualquer negócio com orçamentos, OS e cobrança",
    suggestions: ["Quais funcionalidades?", "Quanto custa?", "Tem app mobile?"],
  },
  {
    keywords: ["app", "mobile", "celular", "android", "ios", "smartphone"],
    answer:
      "O Elevanthe CRM é **100% web responsivo** — funciona perfeitamente no celular pelo navegador, sem precisar instalar nada. Basta acessar pelo Chrome ou Safari no seu smartphone.\n\nUm app nativo para iOS e Android está nos planos para versões futuras.",
    suggestions: ["Quais funcionalidades?", "Quanto custa?"],
  },
  {
    keywords: ["funcionário", "funcionario", "equipe", "usuario", "usuário", "acesso", "permissão", "permissao"],
    answer:
      "Sim! No plano **Enterprise (R$ 260/ano)** você tem **1 funcionário auxiliar incluso** com painel de permissões. Você define o que o funcionário pode ver e editar — clientes, OS, orçamentos, financeiro.\n\nNo plano Business é possível adicionar funcionários extras com custo adicional.",
    suggestions: ["Quanto custa o Enterprise?", "Quais funcionalidades?"],
  },
  {
    keywords: ["seguro", "segurança", "dado", "privacidade", "lgpd", "proteg"],
    answer:
      "Sim, os seus dados e os dos seus clientes são protegidos com:\n\n• **Autenticação segura** com criptografia de senha\n• **Sessão única** — acesso simultâneo de outro dispositivo encerra a sessão anterior\n• **Banco de dados isolado** por empresa\n• **HTTPS** em todas as comunicações\n\nSeguimos as diretrizes da LGPD.",
    suggestions: ["Como funciona o multi-usuário?", "Quais funcionalidades?"],
  },
  {
    keywords: ["suporte", "ajuda", "problema", "erro", "bug", "contato", "email"],
    answer:
      "Nosso suporte está disponível por:\n\n• **Chat interno** (após o login, no menu Suporte)\n• **E-mail** — suporte@elevanthe.com.br\n• **Tickets** com histórico e acompanhamento no painel\n\nClientes do plano Business têm suporte prioritário e Enterprise têm suporte VIP com resposta mais rápida.",
    suggestions: ["Quanto custa?", "Como criar uma conta?"],
  },
  {
    keywords: ["senha", "esqueci", "redefinir", "recuperar", "login", "entrar", "acessar"],
    answer:
      'Para redefinir sua senha, clique em **"Esqueci a senha"** na tela de login e informe seu e-mail. Você receberá um link de redefinição em instantes.\n\nSe o e-mail não chegar, confira a pasta de spam ou entre em contato com suporte@elevanthe.com.br.',
    suggestions: ["Como criar conta?", "Falar com suporte"],
  },
  {
    keywords: ["criar", "cadastrar", "cadastro", "conta", "registrar", "comecar", "começar", "iniciar"],
    answer:
      "É bem simples! Clique em **"Criar conta grátis"** no canto superior direito, preencha nome, e-mail e senha — e pronto. Você acessa o sistema imediatamente e escolhe um plano para desbloquear todos os recursos.",
    suggestions: ["Quanto custa?", "Tem período grátis?", "Quais funcionalidades?"],
  },
  {
    keywords: ["ativar", "ativação", "ativacao", "código", "codigo", "promo", "cupom", "chave"],
    answer:
      "Após criar sua conta, você será direcionado para a página de planos. Selecione o plano desejado e conclua o pagamento pelo **Mercado Pago**.\n\nA ativação é **instantânea** — assim que o pagamento for confirmado (Pix em segundos, cartão em minutos), o acesso é liberado automaticamente.",
    suggestions: ["Quais os planos disponíveis?", "Formas de pagamento"],
  },
  {
    keywords: ["cancelar", "cancelamento", "reembolso", "devolver", "dinheiro", "estorno"],
    answer:
      "Como os planos são de acesso temporário (não recorrente), não há cancelamento automático — basta não renovar quando vencer.\n\nPara reembolsos, entre em contato em até 7 dias pela política do Mercado Pago em suporte@elevanthe.com.br.",
    suggestions: ["Quanto custa?", "Como funciona o suporte?"],
  },
  {
    keywords: ["relatorio", "relatório", "grafico", "gráfico", "metrica", "métrica", "análise", "analise"],
    answer:
      "O módulo de **Relatórios** oferece:\n\n• Receita por período\n• Serviços mais realizados\n• Clientes que mais geram receita\n• Status das ordens de serviço\n• Gráficos visuais de performance\n\nDisponível nos planos Business e Enterprise.",
    suggestions: ["Quais funcionalidades?", "Quanto custa o Business?"],
  },
]

function getBotReply(msg: string): { answer: string; suggestions?: string[] } {
  const lower = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  for (const faq of FAQ) {
    if (faq.keywords.some((kw) => lower.includes(kw))) {
      return { answer: faq.answer, suggestions: faq.suggestions }
    }
  }
  return {
    answer:
      "Não tenho uma resposta específica para isso ainda, mas posso te ajudar com outras dúvidas! Para suporte especializado, entre em contato em **suporte@elevanthe.com.br** ou abra um ticket após o login.",
    suggestions: ["Quanto custa?", "O que é o Elevanthe?", "Quais funcionalidades?", "Como criar conta?"],
  }
}

// ─── Renderiza markdown simples (negrito **texto**) ───────────────────────────
function RenderText({ text }: { text: string }) {
  const lines = text.split("\n")
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Converte **bold** para <strong>
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        )
      })}
    </div>
  )
}

// ─── Sugestões rápidas clicáveis ──────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  "Quanto custa?",
  "O que é o Elevanthe?",
  "Quais funcionalidades?",
  "Tem período grátis?",
  "Como criar conta?",
]

export function LoginChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "bot",
      text: "Olá! Sou o assistente do **Elevanthe CRM**. Tire suas dúvidas sobre a plataforma, planos, preços e funcionalidades — estou aqui para ajudar!",
      suggestions: QUICK_SUGGESTIONS,
    },
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    }
  }, [msgs, open])

  function addBotReply(userText: string) {
    const { answer, suggestions } = getBotReply(userText)
    setTyping(true)
    setTimeout(
      () => {
        setTyping(false)
        setMsgs((prev) => [...prev, { role: "bot", text: answer, suggestions }])
      },
      600 + Math.random() * 400
    )
  }

  function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg) return
    setInput("")
    setMsgs((prev) => [...prev, { role: "user", text: msg }])
    addBotReply(msg)
  }

  const lastMsg = msgs[msgs.length - 1]
  const showSuggestions = !typing && lastMsg?.role === "bot" && !!lastMsg.suggestions?.length

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* ── Painel do chat ── */}
      {open && (
        <div className="w-[340px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-primary px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-full bg-primary-foreground/15 flex items-center justify-center ring-2 ring-primary-foreground/20">
                <Sparkles className="size-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary-foreground leading-none">Elevanthe</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[11px] text-primary-foreground/70">Assistente online</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              aria-label="Fechar chat"
            >
              <ChevronDown className="size-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[340px] bg-background/60">
            {msgs.map((m, i) => (
              <div key={i} className="space-y-2">
                <div className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[90%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    <RenderText text={m.text} />
                  </div>
                </div>
                {/* Sugestões da mensagem (só na última msg do bot) */}
                {m.role === "bot" && i === msgs.length - 1 && showSuggestions && (
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    {m.suggestions!.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Indicador de digitação */}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2.5 flex gap-1 items-center">
                  <span className="size-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-border bg-card">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Digite sua dúvida..."
              className="flex-1 h-9 rounded-xl border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || typing}
              className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40"
              aria-label="Enviar"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Botão flutuante ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "size-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-all duration-200",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          open ? "scale-90" : "hover:scale-105"
        )}
        aria-label="Abrir assistente"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  )
}

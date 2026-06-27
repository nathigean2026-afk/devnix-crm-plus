"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { X, Send, ChevronDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Tipos ────────────────────────────────────────────────────────────────────
type ChatMsg = {
  role: "user" | "bot"
  text: string
  suggestions?: string[]
}

// ─── Base de conhecimento completa ────────────────────────────────────────────
const FAQ: Array<{ keywords: string[]; answer: string; suggestions: string[] }> = [
  {
    keywords: ["oi", "ola", "olá", "bom dia", "boa tarde", "boa noite", "opa", "ei", "hello"],
    answer:
      "Olá! Seja bem-vindo ao **Elevanthe CRM**.\n\nSou seu assistente virtual e estou aqui para responder dúvidas sobre planos, funcionalidades, como começar e muito mais. No que posso te ajudar hoje?",
    suggestions: ["Quanto custa?", "Quais funcionalidades tem?", "Tem período grátis?", "Como criar minha conta?"],
  },
  // Planos e preços
  {
    keywords: ["plano", "planos", "preco", "preço", "valor", "custa", "quanto", "mensalidade", "assinatura", "contratar", "pacote"],
    answer:
      "O Elevanthe CRM tem planos para todos os tamanhos de negócio:\n\n**Starter — R$ 49/mês**\nAté 2 usuários, 200 clientes, orçamentos, OS e financeiro básico.\n\n**Pro — R$ 99/mês**\nUsuários ilimitados, clientes ilimitados, relatórios avançados, link público de orçamento, WhatsApp e estoque.\n\n**Business — R$ 189/mês**\nTudo do Pro + multi-empresa, assinatura digital, API, suporte prioritário e personalização de marca completa.\n\nTodos os planos incluem **14 dias grátis**, sem cartão de crédito.",
    suggestions: ["O que inclui cada plano?", "Tem período grátis?", "Como contratar?"],
  },
  // Trial
  {
    keywords: ["gratis", "grátis", "free", "teste", "testar", "trial", "gratuito", "experimentar", "14 dias", "periodo", "período"],
    answer:
      "Sim! Todos os planos têm **14 dias de teste grátis** — sem precisar cadastrar cartão de crédito.\n\nDurante o trial você tem acesso completo ao plano escolhido:\n- Cadastro de clientes e serviços\n- Criação de orçamentos e OS\n- Cobranças via Pix\n- Relatórios e financeiro\n\nAo final dos 14 dias, escolha um plano para continuar ou cancele sem custo.",
    suggestions: ["Quais planos existem?", "Como criar minha conta?", "Quais funcionalidades tem?"],
  },
  // Funcionalidades
  {
    keywords: ["funcionalidade", "funcionalidades", "recurso", "recursos", "o que faz", "o que tem", "modulo", "módulo", "features"],
    answer:
      "O Elevanthe CRM é uma plataforma completa para prestadores de serviço:\n\n**Gestão comercial**\n- Clientes com histórico completo\n- Orçamentos com link público de aprovação\n- Ordens de Serviço com acompanhamento\n\n**Financeiro**\n- Receitas e despesas\n- Cobranças via Pix integrado\n- Relatórios de inadimplência\n\n**Operações**\n- Catálogo de serviços e produtos\n- Controle de estoque\n- Notificações via WhatsApp\n\n**Avançado (Business)**\n- Assinatura digital\n- Multi-empresa\n- Personalização de marca\n- API e Webhooks",
    suggestions: ["Quanto custa?", "Como funciona o Pix?", "Tem integração com WhatsApp?"],
  },
  // WhatsApp
  {
    keywords: ["whatsapp", "zap", "notificacao", "notificação", "mensagem", "automatico", "automático", "aviso", "envio"],
    answer:
      "Sim! O Elevanthe integra com **WhatsApp** para notificações automáticas:\n\n- Envio do **link de orçamento** para o cliente aprovar\n- Confirmação de **abertura de OS**\n- Aviso de **conclusão de serviço** com o valor\n- Lembretes de **pagamento em aberto**\n\nAs mensagens são enviadas com o nome da sua empresa e você pode personalizar o texto.\n\nDisponível nos planos **Pro e Business**.",
    suggestions: ["Como funciona o orçamento público?", "Tem cobrança via Pix?", "Qual plano inclui WhatsApp?"],
  },
  // Pix e pagamentos
  {
    keywords: ["pix", "pagamento", "cobranca", "cobrança", "qr code", "receber", "cartao", "cartão", "parcelar", "parcela", "credito"],
    answer:
      "O Elevanthe tem **Pix integrado** para cobranças diretas:\n\n- Gere QR Code ou código copia-cola em qualquer OS ou orçamento\n- O pagamento é confirmado automaticamente no financeiro\n\nNos orçamentos e OS você também pode informar:\n- **Valor à vista / Pix** com desconto\n- **Valor no cartão de crédito** em até 12 parcelas\n\nEssa informação aparece de forma clara na proposta enviada ao cliente.",
    suggestions: ["Como funciona o financeiro?", "Tem relatórios de recebimentos?", "Quanto custa?"],
  },
  // Orçamento público
  {
    keywords: ["orcamento", "orçamento", "proposta", "link", "publico", "público", "aprovacao", "aprovação", "cliente aprova"],
    answer:
      "O **link público de orçamento** é um dos destaques do sistema:\n\n1. Você cria o orçamento com itens, preços e condições de pagamento\n2. O sistema gera um **link único** para enviar ao cliente\n3. O cliente abre no celular — sem instalar nada ou fazer login\n4. Ele aprova ou recusa com um clique, podendo deixar um comentário\n5. Você recebe notificação em tempo real da resposta\n\nDisponível a partir do plano **Pro**.",
    suggestions: ["Tem envio via WhatsApp?", "Como funciona a assinatura digital?", "Quanto custa o Pro?"],
  },
  // OS
  {
    keywords: ["ordem de servico", "ordem de serviço", "os", "servico", "serviço", "chamado", "ticket"],
    answer:
      "As **Ordens de Serviço** do Elevanthe permitem controlar toda a execução:\n\n- Abertura de OS vinculada ao cliente e ao orçamento aprovado\n- Status em tempo real: Aberta, Em andamento, Aguardando, Concluída\n- Registro de materiais e mão de obra utilizados\n- Condições de pagamento (à vista, cartão e parcelas)\n- Envio automático de notificação ao cliente ao abrir e concluir\n- Impressão de OS formatada para entrega\n\nTudo integrado ao financeiro para controle de receita.",
    suggestions: ["Como funciona o Pix?", "Tem orçamento com link público?", "Quanto custa?"],
  },
  // Relatórios
  {
    keywords: ["relatorio", "relatório", "relatorios", "relatórios", "metricas", "métricas", "dashboard", "grafico", "gráfico", "kpi", "analise", "análise"],
    answer:
      "O módulo de **Relatórios** oferece visão completa do negócio:\n\n- Receita por período (dia, semana, mês, ano)\n- Volume e taxa de conclusão de OS\n- Taxa de aprovação de orçamentos\n- Clientes novos, recorrentes e inativos\n- Inadimplência e cobranças em aberto\n- Ranking de serviços mais vendidos\n\nExporte todos os relatórios em **PDF ou Excel**.\n\nDisponível nos planos **Pro e Business**.",
    suggestions: ["Tem financeiro integrado?", "Quanto custa o Pro?", "Quais funcionalidades tem?"],
  },
  // Estoque
  {
    keywords: ["estoque", "produto", "produtos", "inventario", "inventário", "item", "peca", "peça", "material"],
    answer:
      "O **Controle de Estoque** permite gerenciar produtos e insumos usados nos serviços:\n\n- Cadastre produtos com código, descrição, quantidade e custo\n- Ao usar um item em uma OS, o estoque é descontado automaticamente\n- Alertas quando o estoque estiver abaixo do mínimo definido\n- Histórico completo de entradas e saídas\n\nDisponível nos planos **Pro e Business**.",
    suggestions: ["Como funciona a OS?", "Tem catálogo de serviços?", "Quanto custa o Pro?"],
  },
  // Multi-usuário
  {
    keywords: ["usuario", "usuário", "funcionario", "funcionário", "equipe", "permissao", "permissão", "acesso", "colaborador"],
    answer:
      "O Elevanthe suporta **múltiplos usuários** com controle de permissões individuais:\n\n- Cada funcionário tem seu próprio login e senha\n- O administrador define o que cada um pode ver e editar\n- Permissões por módulo: clientes, orçamentos, OS, financeiro e relatórios\n- Starter: 2 usuários — Pro e Business: usuários ilimitados",
    suggestions: ["Tem multi-empresa?", "Quanto custa o Pro?", "Quais funcionalidades tem?"],
  },
  // Multi-empresa
  {
    keywords: ["multi-empresa", "multiempresa", "cnpj", "filial", "varios negocios", "vários negócios"],
    answer:
      "Com o **Multi-empresa** você gerencia múltiplos CNPJs dentro do mesmo sistema:\n\n- Cada empresa tem clientes, orçamentos, OS e financeiro separados\n- Troque entre empresas com um clique, sem precisar sair\n- Cada empresa tem sua própria logo, nome e dados fiscais\n- Ideal para grupos empresariais ou donos de mais de um negócio\n\nExclusivo do plano **Business**.",
    suggestions: ["O que inclui o Business?", "Quanto custa?", "Tem personalização de marca?"],
  },
  // Assinatura digital
  {
    keywords: ["assinatura", "digital", "contrato", "documento", "assinar", "eletronico", "eletrônico"],
    answer:
      "A **Assinatura Digital** permite que contratos e propostas sejam assinados online:\n\n- Envie qualquer documento para assinatura pelo cliente\n- O cliente assina pelo celular ou computador, sem instalar nada\n- Documento assinado fica armazenado com validade jurídica\n- Ideal para contratos de prestação de serviço, termos e garantias\n\nExclusivo do plano **Business**.",
    suggestions: ["Como contratar o Business?", "Tem orçamento público?", "Quanto custa?"],
  },
  // Personalização
  {
    keywords: ["personalizar", "personalizacao", "personalização", "logo", "marca", "branca", "white label", "identidade", "visual"],
    answer:
      "No plano **Business** você personaliza completamente a aparência:\n\n- **Logo** da sua empresa no sistema e nos documentos\n- **Nome e dados** exibidos em orçamentos e OS\n- **CNPJ e informações fiscais** na documentação\n- **Cores** da interface adaptadas à sua marca\n\nSeus clientes veem sua empresa, não a marca do Elevanthe.",
    suggestions: ["Quanto custa o Business?", "Tem assinatura digital?", "Tem multi-empresa?"],
  },
  // Segurança
  {
    keywords: ["seguranca", "segurança", "privacidade", "lgpd", "dado", "criptografia", "backup", "seguro"],
    answer:
      "A segurança dos seus dados é prioridade absoluta:\n\n- Criptografia **AES-256** nos dados armazenados\n- Conexões protegidas com **SSL/TLS**\n- **Backups automáticos** diários\n- Em conformidade com a **LGPD**\n- Senhas armazenadas com hash seguro (nunca em texto puro)\n- Sessão única por dispositivo com encerramento seguro\n\nSeus dados jamais são vendidos ou compartilhados com terceiros.",
    suggestions: ["Como faço login?", "Esqueci minha senha", "Falar com suporte"],
  },
  // Recuperar senha
  {
    keywords: ["esqueci", "senha", "recuperar", "redefinir", "reset", "acesso", "entrar", "login"],
    answer:
      "Para redefinir sua senha:\n\n1. Na tela de login, clique em **\"Esqueci a senha\"**\n2. Digite seu e-mail cadastrado\n3. Acesse sua caixa de entrada e clique no link recebido\n4. Defina uma nova senha\n\nO link expira em **1 hora**. Não chegou? Verifique o spam ou fale conosco: **suporte@elevanthe.com.br**",
    suggestions: ["Como criar minha conta?", "Falar com suporte", "Quais planos existem?"],
  },
  // Criar conta
  {
    keywords: ["criar", "cadastrar", "cadastro", "conta", "registrar", "comecar", "começar", "novo", "inicio", "início"],
    answer:
      "Criar sua conta é simples e gratuito:\n\n1. Clique em **\"Criar conta grátis\"** no canto superior direito\n2. Preencha nome, e-mail e senha\n3. Confirme seu e-mail (chega em alguns minutos)\n4. Configure sua empresa e comece a usar\n\nVocê tem **14 dias grátis** do plano Pro sem precisar de cartão de crédito.",
    suggestions: ["Tem período grátis?", "Quais funcionalidades tem?", "Quanto custa?"],
  },
  // App mobile
  {
    keywords: ["app", "mobile", "celular", "android", "ios", "iphone", "smartphone", "aplicativo"],
    answer:
      "O Elevanthe é **100% responsivo** — funciona perfeitamente no celular pelo navegador (Chrome ou Safari), sem precisar instalar nada:\n\n- Crie OS e orçamentos direto do campo\n- Acesse financeiro e relatórios em qualquer lugar\n- Receba notificações em tempo real\n\nUm **aplicativo nativo** para Android e iOS está no nosso roadmap. Fique de olho nas novidades!",
    suggestions: ["Quais funcionalidades tem?", "Tem notificações?", "Quanto custa?"],
  },
  // Suporte
  {
    keywords: ["suporte", "ajuda", "atendimento", "contato", "falar", "humano", "problema", "bug", "erro"],
    answer:
      "Nosso suporte está disponível por:\n\n- **Chat ao vivo** — dentro da plataforma após login, em horário comercial\n- **E-mail** — suporte@elevanthe.com.br (resposta em até 4h úteis)\n- **WhatsApp** — disponível para planos Pro e Business\n- **Central de ajuda** — help.elevanthe.com.br com tutoriais e vídeos\n\nHorário de atendimento: **segunda a sexta, das 8h às 18h**.",
    suggestions: ["Como abrir um ticket?", "Tem documentação?", "Quais planos existem?"],
  },
  // Cancelamento
  {
    keywords: ["cancelar", "cancelamento", "sair", "encerrar", "parar", "desativar", "excluir"],
    answer:
      "Você pode cancelar a qualquer momento, sem multa:\n\n1. Acesse **Configurações > Minha Assinatura**\n2. Clique em **\"Cancelar plano\"**\n3. O acesso segue ativo até o fim do período pago\n\nSeus dados ficam disponíveis por **30 dias** após o cancelamento para exportação. Após esse prazo são removidos permanentemente.\n\nPrecisa de ajuda? **suporte@elevanthe.com.br**",
    suggestions: ["Posso pausar meu plano?", "Como exportar meus dados?", "Falar com suporte"],
  },
  // API / Integracoes
  {
    keywords: ["api", "webhook", "integracao", "integração", "erp", "sistema externo"],
    answer:
      "O Elevanthe oferece conectividade para integrar com outros sistemas:\n\n- **API REST** documentada para integrar com ERP, e-commerce e sistemas internos\n- **Webhooks** para receber eventos em tempo real (aprovação de orçamento, pagamento confirmado, OS concluída)\n- Integração com **Pix** e **WhatsApp** já nativas\n- Integração com **nota fiscal eletrônica (NF-e)** em desenvolvimento\n\nAPI disponível exclusivamente no plano **Business**.",
    suggestions: ["Quanto custa o Business?", "Tem WhatsApp integrado?", "Falar com suporte técnico"],
  },
]

// ─── Fallback ─────────────────────────────────────────────────────────────────
const FALLBACK = {
  answer:
    "Não encontrei uma resposta exata para isso ainda, mas nossa equipe pode te ajudar!\n\nEntre em contato pelo e-mail **suporte@elevanthe.com.br** ou acesse nossa central de ajuda em **help.elevanthe.com.br**.\n\nOu escolha um dos tópicos abaixo:",
  suggestions: ["Quanto custa?", "Quais funcionalidades tem?", "Como criar minha conta?", "Falar com suporte"],
}

const QUICK_SUGGESTIONS = [
  "Quanto custa?",
  "Tem período grátis?",
  "Quais funcionalidades tem?",
  "Como funciona o Pix?",
  "Tem app mobile?",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBotReply(msg: string): { answer: string; suggestions: string[] } {
  const q = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  for (const faq of FAQ) {
    if (faq.keywords.some((kw) => q.includes(kw))) {
      return { answer: faq.answer, suggestions: faq.suggestions }
    }
  }
  return FALLBACK
}

function RenderText({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((p, j) =>
              j % 2 === 1 ? <strong key={j} className="font-semibold">{p}</strong> : p
            )}
          </p>
        )
      })}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function LoginChatWidget() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "bot",
      text: "Olá! Sou o assistente do **Elevanthe CRM**.\n\nPosso responder dúvidas sobre planos, preços, funcionalidades, suporte e muito mais. O que você precisa saber?",
      suggestions: QUICK_SUGGESTIONS,
    },
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    }
  }, [msgs, open, minimized])

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus()
  }, [open, minimized])

  function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || typing) return
    setInput("")
    setMsgs((prev) => [...prev, { role: "user", text: msg }])
    setTyping(true)
    const delay = 650 + Math.random() * 450
    setTimeout(() => {
      const { answer, suggestions } = getBotReply(msg)
      setTyping(false)
      setMsgs((prev) => [...prev, { role: "bot", text: answer, suggestions }])
    }, delay)
  }

  const lastIdx = msgs.length - 1
  const lastMsg = msgs[lastIdx]
  const showSuggestions = !typing && lastMsg?.role === "bot" && !!lastMsg.suggestions?.length

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* ── Janela do chat ── */}
      {open && (
        <div
          className={cn(
            "w-[360px] rounded-2xl border border-border bg-background shadow-2xl shadow-black/20 flex flex-col overflow-hidden transition-all duration-200",
            minimized ? "h-[56px]" : "h-[520px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary shrink-0">
            <div className="relative size-9 rounded-full overflow-hidden ring-2 ring-white/20 shrink-0">
              <Image
                src="/elevanthe-chatbot-logo.png"
                alt="Elevanthe Assistente"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Elevanthe</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                <p className="text-[11px] text-white/70">Assistente online</p>
              </div>
            </div>
            <button
              onClick={() => setMinimized((v) => !v)}
              className="text-white/60 hover:text-white p-1 transition-colors"
              aria-label={minimized ? "Expandir" : "Minimizar"}
            >
              <Minus className="size-4" />
            </button>
            <button
              onClick={() => { setOpen(false); setMinimized(false) }}
              className="text-white/60 hover:text-white p-1 transition-colors"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {msgs.map((m, i) => (
                  <div key={i} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px]",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      <RenderText text={m.text} />
                    </div>
                    {/* Sugestoes apenas na ultima mensagem do bot */}
                    {m.role === "bot" && i === lastIdx && showSuggestions && (
                      <div className="flex flex-wrap gap-1.5 max-w-[90%]">
                        {m.suggestions!.map((s) => (
                          <button
                            key={s}
                            onClick={() => send(s)}
                            className="text-[11px] font-medium px-2.5 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Indicador de digitacao */}
                {typing && (
                  <div className="flex items-start">
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-3 flex gap-1 items-center">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                          style={{ animationDelay: `${d * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-border bg-background shrink-0">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                    placeholder="Digite sua duvida..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || typing}
                    className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors shrink-0"
                    aria-label="Enviar"
                  >
                    <Send className="size-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                  Elevanthe CRM &middot; suporte@elevanthe.com.br
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Botao flutuante ── */}
      <button
        onClick={() => { setOpen((v) => !v); setMinimized(false) }}
        className={cn(
          "relative size-14 rounded-full shadow-lg transition-all duration-200 overflow-hidden",
          "ring-2 ring-primary/20 hover:ring-primary/50 hover:scale-105",
          open && "scale-95 ring-primary/50"
        )}
        aria-label="Abrir assistente Elevanthe"
      >
        <Image
          src="/elevanthe-chatbot-logo.png"
          alt="Elevanthe Assistente"
          fill
          className="object-cover"
        />
      </button>
    </div>
  )
}

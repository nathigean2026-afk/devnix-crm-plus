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

// ─── Normaliza texto para comparação ──────────────────────────────────────────
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

// ─── Base de conhecimento completa ────────────────────────────────────────────
// Cada FAQ tem:
//   keywords  — termos que DEVEM aparecer na mensagem
//   exclusive — se presente, pelo menos um desses termos OBRIGATORIAMENTE aparece
//               (impede que FAQs gerais engolam perguntas específicas)
type FAQEntry = {
  keywords: string[]
  exclusive?: string[]
  answer: string
  suggestions: string[]
}

const FAQ: FAQEntry[] = [
  // ── Saudação ──────────────────────────────────────────────────────────────
  {
    exclusive: ["oi", "ola", "bom dia", "boa tarde", "boa noite", "opa", "ei", "hello", "tudo bem", "tudo bom"],
    keywords:  ["oi", "ola", "bom dia", "boa tarde", "boa noite", "opa", "ei", "hello", "tudo bem", "tudo bom"],
    answer:
      "Olá! Seja bem-vindo ao **Elevanthe CRM**.\n\nSou seu assistente virtual e estou aqui para tirar todas as suas dúvidas sobre planos, funcionalidades, como começar e muito mais. No que posso te ajudar?",
    suggestions: ["Quanto custa?", "Quais funcionalidades tem?", "Tem período grátis?", "Como criar minha conta?"],
  },

  // ── Criar conta / Cadastro ────────────────────────────────────────────────
  {
    exclusive: ["criar conta", "cadastrar", "cadastro", "registrar", "comecar", "como abrir", "quero comecar", "quero entrar"],
    keywords:  ["criar", "cadastrar", "cadastro", "conta", "registrar", "comecar", "inicio", "comecar a usar"],
    answer:
      "Criar sua conta é rápido, gratuito e sem precisar de cartão:\n\n1. Clique em **\"Criar conta grátis\"** no botão acima\n2. Preencha nome completo, e-mail e senha\n3. Confirme seu e-mail (o link chega em até 2 minutos)\n4. Configure sua empresa e comece a usar imediatamente\n\nVocê ganha **14 dias grátis** com acesso completo ao plano Pro, sem nenhum compromisso.",
    suggestions: ["Quanto custa após o período grátis?", "Quais funcionalidades tem?", "Tem app mobile?"],
  },

  // ── Trial / Período grátis ────────────────────────────────────────────────
  {
    exclusive: ["gratis", "free", "trial", "gratuito", "experimentar", "14 dias", "periodo gratis", "teste gratis", "sem pagar"],
    keywords:  ["gratis", "free", "trial", "gratuito", "experimentar", "14 dias", "periodo", "teste"],
    answer:
      "Sim! Todos os planos incluem **14 dias de teste grátis** — sem cartão de crédito, sem compromisso.\n\nDurante o trial você tem acesso **completo** ao plano Pro:\n- Cadastro ilimitado de clientes e serviços\n- Criação de orçamentos com link público\n- Ordens de Serviço completas\n- Cobranças via Pix integrado\n- Relatórios e financeiro\n- Notificações via WhatsApp\n\nAo final dos 14 dias, escolha um plano para continuar ou cancele sem custo.",
    suggestions: ["Quais são os planos?", "O que inclui o Pro?", "Como criar minha conta?"],
  },

  // ── Plano Starter ─────────────────────────────────────────────────────────
  {
    exclusive: ["starter", "plano basico", "plano inicial", "mais barato", "entrada"],
    keywords:  ["starter", "basico", "basico", "inicial", "mais barato", "menor plano"],
    answer:
      "O **Plano Starter — R$ 49/mês** é ideal para autônomos e pequenas operações:\n\n- Até **2 usuários**\n- Até **200 clientes cadastrados**\n- Orçamentos e Ordens de Serviço\n- Cobranças via Pix\n- Financeiro básico (receitas e despesas)\n- Catálogo de serviços\n\nNão inclui: relatórios avançados, WhatsApp, estoque, link público de orçamento.",
    suggestions: ["O que tem no Plano Pro?", "Tem período grátis?", "Como contratar?"],
  },

  // ── Plano Pro ─────────────────────────────────────────────────────────────
  {
    exclusive: ["plano pro", "pro ", "o pro", "assinar pro", "quero pro"],
    keywords:  ["pro", "segundo plano", "plano intermediario"],
    answer:
      "O **Plano Pro — R$ 99/mês** é o mais popular para empresas em crescimento:\n\n- **Usuários ilimitados**\n- **Clientes ilimitados**\n- Tudo do Starter, mais:\n- Orçamentos com **link público** de aprovação pelo cliente\n- **Relatórios avançados** (receita, OS, taxa de aprovação, inadimplência)\n- **Notificações via WhatsApp** automáticas\n- **Controle de Estoque**\n- **Métricas de receita** em tempo real\n\nInclui **14 dias grátis**.",
    suggestions: ["O que tem no Business?", "Tem período grátis?", "Como contratar?"],
  },

  // ── Plano Business ────────────────────────────────────────────────────────
  {
    exclusive: ["business", "plano business", "plano empresarial", "plano avancado", "mais completo"],
    keywords:  ["business", "empresarial", "avancado", "completo", "maior plano"],
    answer:
      "O **Plano Business — R$ 189/mês** é a solução completa para empresas consolidadas:\n\n- Tudo do Pro, mais:\n- **Multi-empresa** — gerencie vários CNPJs no mesmo sistema\n- **Assinatura Digital** — contratos assinados online com validade jurídica\n- **Personalização de marca** — sua logo, cores e dados nos documentos\n- **API REST + Webhooks** — integre com ERP, e-commerce e outros sistemas\n- **Suporte prioritário** — atendimento dedicado\n\nInclui **14 dias grátis**.",
    suggestions: ["O que é multi-empresa?", "Como funciona a assinatura digital?", "Como contratar?"],
  },

  // ── Preços / Comparação de planos ─────────────────────────────────────────
  {
    exclusive: ["quanto custa", "qual o preco", "qual o valor", "mensalidade", "planos e precos", "comparar planos", "tabela de planos"],
    keywords:  ["custa", "preco", "valor", "mensalidade", "planos"],
    answer:
      "O Elevanthe tem 3 planos — todos com **14 dias grátis**, sem cartão:\n\n**Starter — R$ 49/mês**\nAté 2 usuários, 200 clientes, OS, orçamentos e Pix.\n\n**Pro — R$ 99/mês** _(mais popular)_\nUsuários ilimitados, clientes ilimitados, WhatsApp, relatórios avançados, estoque e link público.\n\n**Business — R$ 189/mês**\nTudo do Pro + multi-empresa, assinatura digital, API e personalização de marca.\n\nTodos aceitam pagamento via **Pix, Cartão de crédito ou Boleto**.",
    suggestions: ["O que inclui o Starter?", "O que tem no Pro?", "Tem período grátis?"],
  },

  // ── Como contratar ────────────────────────────────────────────────────────
  {
    exclusive: ["como contratar", "como assinar", "como pagar", "forma de pagamento", "boleto", "parcelar assinatura"],
    keywords:  ["contratar", "assinar", "pagar assinatura", "boleto"],
    answer:
      "Para contratar um plano do Elevanthe:\n\n1. Crie sua conta grátis (botão no topo)\n2. Após os 14 dias de trial, vá em **Configurações > Minha Assinatura**\n3. Escolha o plano desejado\n4. Pague via **Pix** (desconto de 5%), **Cartão de crédito** ou **Boleto**\n\nO acesso é liberado imediatamente após a confirmação do pagamento. Você pode mudar de plano a qualquer momento.",
    suggestions: ["Quais são os planos?", "Tem período grátis?", "Como cancelar?"],
  },

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  {
    exclusive: ["whatsapp", "zap", "zap zap", "wpp"],
    keywords:  ["whatsapp", "zap", "wpp"],
    answer:
      "Sim! O Elevanthe integra com **WhatsApp** para envios automáticos ao cliente:\n\n- Link do orçamento para **aprovação** pelo cliente\n- Confirmação de **abertura de OS**\n- Aviso de **conclusão de serviço** com o valor total\n- Lembrete de **pagamento em aberto**\n- Notificação quando o cliente **aprovar ou recusar** um orçamento\n\nAs mensagens saem com o **nome da sua empresa** e você pode personalizar os textos.\n\nDisponível nos planos **Pro e Business**.",
    suggestions: ["Como funciona o orçamento público?", "Tem cobrança via Pix?", "Quanto custa o Pro?"],
  },

  // ── Pix / Pagamentos ──────────────────────────────────────────────────────
  {
    exclusive: ["pix", "qr code", "qrcode", "cobranca", "receber pagamento", "cartao de credito", "parcelar", "boleto cliente"],
    keywords:  ["pix", "cobranca", "qr code", "cartao", "parcela", "receber"],
    answer:
      "O Elevanthe tem **Pix integrado** para cobranças diretas:\n\n- Gere **QR Code ou código copia-cola** em qualquer OS ou orçamento\n- O pagamento é confirmado automaticamente no financeiro\n- Zero taxa para cobranças via Pix\n\nNos orçamentos e OS você também informa as condições de pagamento:\n- **Valor à vista / Pix** (com possível desconto)\n- **Valor no cartão de crédito** dividido em até **12 parcelas**\n\nEssas informações aparecem de forma clara na proposta enviada ao cliente.",
    suggestions: ["Como funciona o financeiro?", "Tem relatório de recebimentos?", "Quanto custa?"],
  },

  // ── Orçamento público ─────────────────────────────────────────────────────
  {
    exclusive: ["orcamento", "link publico", "proposta", "cliente aprova", "aprovacao de orcamento"],
    keywords:  ["orcamento", "proposta", "link", "publico", "aprovacao"],
    answer:
      "O **link público de orçamento** é um dos destaques do Elevanthe:\n\n1. Você cria o orçamento com itens, preços e condições de pagamento\n2. O sistema gera um **link único e seguro**\n3. Você envia por WhatsApp, e-mail ou mensagem\n4. O cliente abre no celular **sem precisar de login ou app**\n5. Ele aprova ou recusa com um clique, podendo deixar comentário\n6. Você recebe notificação em tempo real\n\nAo aprovar, uma **OS pode ser aberta automaticamente**.\n\nDisponível no plano **Pro e Business**.",
    suggestions: ["Tem envio via WhatsApp?", "Como funciona a assinatura digital?", "Quanto custa o Pro?"],
  },

  // ── Ordens de Serviço ─────────────────────────────────────────────────────
  {
    exclusive: ["ordem de servico", "ordem de serviço", "os ", "abrir os", "chamado", "ticket de servico"],
    keywords:  ["ordem de servico", "os", "chamado", "servico"],
    answer:
      "As **Ordens de Serviço (OS)** do Elevanthe controlam toda a execução:\n\n- Abertura vinculada ao cliente e ao orçamento aprovado\n- Status em tempo real: **Aberta, Em andamento, Aguardando, Concluída**\n- Registro de materiais e mão de obra utilizados\n- Condições de pagamento: à vista, Pix e **cartão em até 12x**\n- Notificação automática ao cliente na abertura e conclusão\n- **Impressão de OS** formatada para entrega\n- Histórico completo vinculado ao cliente\n\nTudo integrado ao financeiro para controle de receita.",
    suggestions: ["Como funciona o Pix?", "Tem orçamento com link público?", "Quanto custa?"],
  },

  // ── Relatórios ────────────────────────────────────────────────────────────
  {
    exclusive: ["relatorio", "relatorios", "metricas", "dashboard", "grafico", "kpi", "analise de vendas"],
    keywords:  ["relatorio", "metricas", "dashboard", "grafico", "kpi", "analise"],
    answer:
      "O módulo de **Relatórios** dá visão completa do negócio:\n\n- Receita por período (dia, semana, mês, ano)\n- Volume e taxa de conclusão de OS\n- Taxa de aprovação de orçamentos\n- Clientes novos, recorrentes e inativos\n- Inadimplência e cobranças em aberto\n- Ranking dos **serviços mais vendidos**\n- Comparativo de períodos\n\nExporte tudo em **PDF ou Excel**.\n\nDisponível nos planos **Pro e Business**.",
    suggestions: ["Tem financeiro integrado?", "Quanto custa o Pro?", "Quais funcionalidades tem?"],
  },

  // ── Estoque ───────────────────────────────────────────────────────────────
  {
    exclusive: ["estoque", "inventario", "produto", "produtos", "peca", "material", "insumo"],
    keywords:  ["estoque", "inventario", "produto", "peca", "material"],
    answer:
      "O **Controle de Estoque** permite gerenciar produtos e insumos:\n\n- Cadastre itens com código, descrição, quantidade e custo\n- Ao usar um produto em uma OS, o estoque é **descontado automaticamente**\n- **Alertas** quando o estoque cair abaixo do mínimo definido\n- Histórico completo de entradas e saídas\n- Relatório de consumo por período\n\nDisponível nos planos **Pro e Business**.",
    suggestions: ["Como funciona a OS?", "Tem catálogo de serviços?", "Quanto custa o Pro?"],
  },

  // ── Multi-usuário ─────────────────────────────────────────────────────────
  {
    exclusive: ["usuario", "funcionario", "equipe", "permissao", "colaborador", "acesso de funcionario"],
    keywords:  ["usuario", "funcionario", "equipe", "permissao", "colaborador"],
    answer:
      "O Elevanthe suporta **múltiplos usuários** com controle de permissões:\n\n- Cada funcionário tem seu próprio **login e senha**\n- O administrador define o que cada um pode **ver e editar**\n- Permissões por módulo: clientes, orçamentos, OS, financeiro e relatórios\n- Log de atividades por usuário\n\n**Starter:** até 2 usuários\n**Pro e Business:** usuários ilimitados",
    suggestions: ["Tem multi-empresa?", "Quanto custa o Pro?", "Quais funcionalidades tem?"],
  },

  // ── Multi-empresa ─────────────────────────────────────────────────────────
  {
    exclusive: ["multi-empresa", "multiempresa", "varios cnpj", "duas empresas", "filial"],
    keywords:  ["multi-empresa", "multiempresa", "cnpj", "filial", "duas empresas"],
    answer:
      "Com o **Multi-empresa** você gerencia vários CNPJs em um só sistema:\n\n- Cada empresa tem clientes, orçamentos, OS e financeiro **totalmente separados**\n- Troque entre empresas com um clique, sem sair\n- Cada empresa com sua própria logo, nome e dados fiscais\n- Relatórios por empresa ou consolidado\n- Ideal para grupos empresariais ou donos de mais de um negócio\n\nExclusivo do plano **Business — R$ 189/mês**.",
    suggestions: ["O que inclui o Business?", "Tem personalização de marca?", "Quanto custa?"],
  },

  // ── Assinatura digital ────────────────────────────────────────────────────
  {
    exclusive: ["assinatura digital", "assinar contrato", "contrato online", "documento online", "assinar online"],
    keywords:  ["assinatura digital", "contrato", "assinar", "documento"],
    answer:
      "A **Assinatura Digital** permite que contratos e propostas sejam assinados online:\n\n- Envie qualquer documento para o cliente assinar\n- O cliente assina pelo **celular ou computador**, sem instalar nada\n- Documento assinado armazenado com **validade jurídica**\n- Histórico de quem assinou, quando e de qual IP\n- Ideal para: contratos de prestação de serviço, termos de garantia, autorizações\n\nExclusivo do plano **Business**.",
    suggestions: ["Como contratar o Business?", "Tem link público de orçamento?", "Quanto custa?"],
  },

  // ── Personalização de marca ───────────────────────────────────────────────
  {
    exclusive: ["personalizar", "personalizacao", "minha logo", "minha marca", "white label", "identidade visual"],
    keywords:  ["personalizar", "personalizacao", "logo", "marca", "white label"],
    answer:
      "No plano **Business** você personaliza a aparência completamente:\n\n- Sua **logo** nos documentos, orçamentos e OS enviados ao cliente\n- **Nome e CNPJ** da empresa em toda a documentação\n- **Cores** da interface adaptadas à sua identidade visual\n\nSeus clientes veem sua empresa, não a marca do Elevanthe — ideal para quem preza pela imagem profissional.",
    suggestions: ["Quanto custa o Business?", "Tem assinatura digital?", "Tem multi-empresa?"],
  },

  // ── App mobile ────────────────────────────────────────────────────────────
  {
    exclusive: ["app", "aplicativo", "android", "ios", "iphone", "play store", "app store"],
    keywords:  ["app", "mobile", "celular", "android", "ios", "aplicativo"],
    answer:
      "O Elevanthe é **100% responsivo** — funciona perfeitamente no celular pelo navegador (Chrome ou Safari), sem instalar nada:\n\n- Crie OS e orçamentos direto do campo\n- Acesse financeiro e relatórios em qualquer lugar\n- Receba notificações em tempo real\n- Funciona em qualquer smartphone, tablet ou computador\n\nUm **aplicativo nativo** para Android e iOS está no roadmap para 2025. Fique de olho nas novidades!",
    suggestions: ["Quais funcionalidades tem?", "Tem notificações?", "Quanto custa?"],
  },

  // ── Segurança ─────────────────────────────────────────────────────────────
  {
    exclusive: ["seguranca", "privacidade", "lgpd", "criptografia", "backup", "meus dados"],
    keywords:  ["seguranca", "privacidade", "lgpd", "dado", "criptografia", "backup"],
    answer:
      "A segurança dos seus dados é prioridade:\n\n- Criptografia **AES-256** nos dados armazenados\n- Conexões protegidas com **SSL/TLS**\n- **Backups automáticos** diários em múltiplos servidores\n- Em conformidade com a **LGPD**\n- Senhas com **hash bcrypt** (nunca armazenadas em texto puro)\n- Sessões com expiração automática e revogação por dispositivo\n\nSeus dados **jamais** são vendidos ou compartilhados com terceiros.",
    suggestions: ["Como redefinir minha senha?", "Falar com suporte", "Quais planos existem?"],
  },

  // ── Recuperar senha ───────────────────────────────────────────────────────
  {
    exclusive: ["esqueci a senha", "recuperar senha", "redefinir senha", "reset de senha", "nao consigo entrar", "nao lembro a senha"],
    keywords:  ["esqueci", "senha", "recuperar", "redefinir", "reset"],
    answer:
      "Para redefinir sua senha:\n\n1. Na tela de login, clique em **\"Esqueci a senha\"**\n2. Digite o e-mail cadastrado na sua conta\n3. Acesse sua caixa de entrada e clique no link recebido\n4. Defina uma nova senha segura\n\nO link de redefinição expira em **1 hora**.\n\nNão chegou o e-mail? Verifique a pasta de spam. Se persistir, fale conosco: **suporte@elevanthe.com**",
    suggestions: ["Como criar minha conta?", "Falar com suporte", "Quais planos existem?"],
  },

  // ── API / Integrações ─────────────────────────────────────────────────────
  {
    exclusive: ["api", "webhook", "integracao com", "erp", "sistema externo", "conectar com outro"],
    keywords:  ["api", "webhook", "integracao", "erp", "sistema externo"],
    answer:
      "O Elevanthe oferece conectividade para integrar com outros sistemas:\n\n- **API REST** documentada — integre com ERP, e-commerce e sistemas internos\n- **Webhooks** para eventos em tempo real: aprovação de orçamento, pagamento confirmado, OS concluída\n- Integrações nativas: **Pix** e **WhatsApp**\n- **NF-e (Nota Fiscal eletrônica)** em desenvolvimento\n\nDocumentação da API disponível em **developers.elevanthe.com.br**.\n\nAPI exclusiva do plano **Business**.",
    suggestions: ["Quanto custa o Business?", "Tem WhatsApp integrado?", "Falar com suporte técnico"],
  },

  // ── Cancelamento ──────────────────────────────────────────────────────────
  {
    exclusive: ["cancelar", "cancelamento", "encerrar conta", "parar de usar", "desativar conta"],
    keywords:  ["cancelar", "cancelamento", "encerrar", "desativar"],
    answer:
      "Você pode cancelar a qualquer momento, **sem multa e sem burocracia**:\n\n1. Acesse **Configurações > Minha Assinatura**\n2. Clique em **\"Cancelar plano\"**\n3. O acesso segue ativo até o fim do período já pago\n\nApós o cancelamento:\n- Seus dados ficam disponíveis por **30 dias** para exportação\n- Após esse prazo, são removidos permanentemente\n\nPrecisa de ajuda? **suporte@elevanthe.com**",
    suggestions: ["Posso pausar meu plano?", "Como exportar meus dados?", "Falar com suporte"],
  },

  // ── Funcionalidades gerais ─────────────────────────────────────────────────
  {
    exclusive: ["funcionalidades", "o que faz", "o que tem", "recursos", "features", "modulos", "para que serve"],
    keywords:  ["funcionalidade", "recurso", "o que faz", "o que tem", "modulo", "features"],
    answer:
      "O Elevanthe CRM é a plataforma completa para prestadores de serviço:\n\n**Gestão Comercial**\n- Clientes com histórico completo\n- Orçamentos com link público de aprovação\n- Ordens de Serviço do início ao fim\n\n**Financeiro**\n- Receitas, despesas e saldo\n- Cobranças via Pix integrado\n- Relatórios de inadimplência\n\n**Operações**\n- Catálogo de serviços e produtos\n- Controle de estoque\n- Notificações automáticas via WhatsApp\n\n**Avançado (Business)**\n- Assinatura digital\n- Multi-empresa\n- Personalização de marca\n- API + Webhooks",
    suggestions: ["Quanto custa?", "Tem período grátis?", "Como criar minha conta?"],
  },

  // ── Suporte ───────────────────────────────────────────────────────────────
  {
    exclusive: ["suporte", "ajuda", "atendimento", "falar com alguem", "humano", "contato"],
    keywords:  ["suporte", "ajuda", "atendimento", "falar", "humano", "contato", "problema", "bug"],
    answer:
      "Nosso suporte está disponível por múltiplos canais:\n\n- **Chat ao vivo** — dentro da plataforma após login (seg–sex, 8h–18h)\n- **E-mail** — suporte@elevanthe.com _(resposta em até 4h úteis)_\n- **WhatsApp** — disponível para planos Pro e Business\n- **Central de ajuda** — help.elevanthe.com.br com tutoriais em vídeo\n\nClientes do plano **Business** têm suporte prioritário com atendimento dedicado.",
    suggestions: ["Falar com humano", "Quais planos existem?", "Como criar minha conta?"],
  },
]

// ─── Fallback ─────────────────────────────────────────────────────────────────
const FALLBACK = {
  answer:
    "Não encontrei uma resposta exata para essa pergunta, mas nossa equipe pode te ajudar!\n\nEntre em contato:\n- **E-mail:** suporte@elevanthe.com\n- **Central de ajuda:** help.elevanthe.com.br\n\nOu escolha um dos tópicos abaixo:",
  suggestions: ["Quanto custa?", "Quais funcionalidades tem?", "Como criar minha conta?", "Falar com suporte"],
}

const QUICK_SUGGESTIONS = [
  "Quanto custa?",
  "Tem período grátis?",
  "Quais funcionalidades tem?",
  "Como funciona o Pix?",
  "Tem app mobile?",
]

// ─── Sistema de matching por score ────────────────────────────────────────────
// Conta quantas keywords batem — retorna o FAQ com maior score.
// Se o FAQ tem "exclusive", pelo menos uma deve aparecer para qualificá-lo.
function getBotReply(input: string): { answer: string; suggestions: string[] } {
  const q = norm(input)

  let best: FAQEntry | null = null
  let bestScore = 0

  for (const faq of FAQ) {
    // Se tem exclusive, verifica obrigatoriamente
    if (faq.exclusive) {
      const hasExclusive = faq.exclusive.some((ex) => q.includes(norm(ex)))
      if (!hasExclusive) continue
    }
    // Conta quantas keywords batem
    const score = faq.keywords.filter((kw) => q.includes(norm(kw))).length
    if (score > bestScore) {
      bestScore = score
      best = faq
    }
  }

  if (best && bestScore > 0) {
    return { answer: best.answer, suggestions: best.suggestions }
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
                  Elevanthe CRM &middot; suporte@elevanthe.com
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

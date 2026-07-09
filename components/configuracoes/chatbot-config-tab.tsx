"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { toast } from "sonner"
import { upsertBusinessProfile } from "@/lib/actions"
import type { BusinessProfile } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, GripVertical, Send, Bot, User, RotateCcw, CheckCircle2, Pencil, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Tipos ────────────────────────────────────────────────────────────────────

interface MenuOption {
  id: string
  titulo: string
  resposta: string
}

interface SimulatorMessage {
  role: "bot" | "user"
  text: string
}

interface ChatbotConfigTabProps {
  profile: BusinessProfile | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const NICHOS = [
  { value: "assistencia", label: "Assistência Técnica" },
  { value: "barbearia", label: "Barbearia / Salão" },
  { value: "estetica", label: "Estética / Beleza" },
  { value: "eletrica", label: "Elétrica / Hidráulica" },
  { value: "limpeza", label: "Limpeza / Conservação" },
  { value: "advocacia", label: "Advocacia / Consultoria" },
  { value: "saude", label: "Saúde / Bem-estar" },
  { value: "outros", label: "Outros" },
]

const TEMPLATES: Record<string, { saudacao: string; horario: string; opcoes: MenuOption[] }> = {
  assistencia: {
    saudacao: "Olá! Bem-vindo à nossa assistência técnica. Como posso te ajudar?",
    horario: "Seg–Sex, 8h–18h | Sáb, 8h–12h",
    opcoes: [
      { id: "1", titulo: "Solicitar orçamento", resposta: "Para solicitar um orçamento, nos informe o equipamento, o defeito apresentado e seu nome. Nossa equipe retornará em breve." },
      { id: "2", titulo: "Acompanhar serviço", resposta: "Para acompanhar seu serviço, informe o número da ordem de serviço ou o CPF cadastrado. Vamos verificar para você!" },
      { id: "3", titulo: "Retirar equipamento", resposta: "Seu equipamento está pronto para retirada! Atendemos de Seg–Sex das 8h às 18h e Sábado das 8h às 12h." },
      { id: "4", titulo: "Falar com atendente", resposta: "Um atendente irá retornar em breve. Horário de atendimento: Seg–Sex, 8h–18h." },
    ],
  },
  barbearia: {
    saudacao: "Olá! Bem-vindo à nossa barbearia. Como podemos te atender?",
    horario: "Ter–Sáb, 9h–19h",
    opcoes: [
      { id: "1", titulo: "Agendar horário", resposta: "Para agendar, informe seu nome, o serviço desejado e o horário de preferência. Confirmaremos a disponibilidade!" },
      { id: "2", titulo: "Ver serviços e preços", resposta: "Nossos serviços:\n• Corte — R$ 30\n• Barba — R$ 20\n• Corte + Barba — R$ 45\n• Pigmentação — R$ 60\nHorário: Ter–Sáb, 9h–19h." },
      { id: "3", titulo: "Cancelar agendamento", resposta: "Para cancelar, informe seu nome e o horário agendado. Faremos o cancelamento para você." },
      { id: "4", titulo: "Localização", resposta: "Estamos localizados em [seu endereço]. Fique à vontade para nos visitar!" },
    ],
  },
  estetica: {
    saudacao: "Olá! Seja bem-vindo(a)! Estou aqui para te ajudar. O que deseja?",
    horario: "Seg–Sáb, 9h–20h",
    opcoes: [
      { id: "1", titulo: "Agendar procedimento", resposta: "Para agendar, informe seu nome, o procedimento desejado e a data/horário de preferência. Te confirmamos em breve!" },
      { id: "2", titulo: "Ver procedimentos", resposta: "Realizamos: depilação, design de sobrancelhas, limpeza de pele, manicure, pedicure e muito mais. Qual desses te interessa?" },
      { id: "3", titulo: "Valores e promoções", resposta: "Temos pacotes especiais e promoções semanais! Informe seu interesse que te passamos os valores atualizados." },
      { id: "4", titulo: "Falar com atendente", resposta: "Vou te conectar com nossa atendente agora. Em breve ela entrará em contato!" },
    ],
  },
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform duration-200",
        checked ? "translate-x-4" : "translate-x-0"
      )} />
    </button>
  )
}

// ── Simulador ─────────────────────────────────────────────────────────────────

function ChatSimulator({
  nome,
  saudacao,
  horario,
  contato,
  opcoes,
}: {
  nome: string
  saudacao: string
  horario: string
  contato: string
  opcoes: MenuOption[]
}) {
  const [messages, setMessages] = useState<SimulatorMessage[]>([])
  const [step, setStep] = useState<"idle" | "menu" | "done">("idle")
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  function buildMenuText() {
    const lines = opcoes.map((o, i) => `${i + 1} - ${o.titulo}`).join("\n")
    return (
      `Olá! ${saudacao}\n\n` +
      `Responda com o *número* da opção:\n\n` +
      lines +
      `\n\nDigite *menu* para ver as opções novamente.`
    )
  }

  function start() {
    setMessages([{ role: "bot", text: buildMenuText() }])
    setStep("menu")
    setInput("")
  }

  function reset() {
    setMessages([])
    setStep("idle")
    setInput("")
  }

  function send() {
    const text = input.trim()
    if (!text) return
    const userMsg: SimulatorMessage = { role: "user", text }
    const norm = text.toLowerCase()

    let botReply = ""

    if (norm === "menu" || norm === "0") {
      botReply = buildMenuText()
      setMessages(prev => [...prev, userMsg, { role: "bot", text: botReply }])
      setStep("menu")
      setInput("")
      return
    }

    if (step === "menu") {
      const idx = parseInt(norm) - 1
      const found = opcoes[idx]
      if (found) {
        botReply =
          found.resposta +
          `\n\n_Horário de atendimento: ${horario || "Seg–Sex, 8h–18h"}_` +
          (contato ? `\nContato: ${contato}` : "") +
          `\n\nDigite *menu* para ver as opções.`
        setStep("done")
      } else {
        botReply =
          `Não entendi sua escolha. Por favor, responda com o *número* da opção:\n\n` +
          opcoes.map((o, i) => `${i + 1} - ${o.titulo}`).join("\n") +
          `\n\nOu digite *menu* para reiniciar.`
      }
    } else {
      botReply = `Obrigado! Digite *menu* para ver as opções.`
    }

    setMessages(prev => [...prev, userMsg, { role: "bot", text: botReply }])
    setInput("")
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-[480px] rounded-xl border border-border overflow-hidden bg-[#ECE5DD] dark:bg-[#1a1a1a]">
      {/* Header WhatsApp */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-[#075E54] dark:bg-[#1f2c33]">
        <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="size-4 text-white" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-white leading-tight">
            {nome || "Seu negócio"}
          </p>
          <p className="text-[11px] text-white/70">Chatbot — simulador</p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="size-12 rounded-full bg-white/30 dark:bg-white/10 flex items-center justify-center">
              <Bot className="size-6 text-[#075E54] dark:text-white/60" />
            </div>
            <p className="text-[13px] text-[#667781] dark:text-white/40 leading-relaxed">
              Clique em <strong>Iniciar simulação</strong> para testar como seu cliente verá o chatbot.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm",
                m.role === "user"
                  ? "bg-[#DCF8C6] dark:bg-[#005c4b] text-[#111] dark:text-white rounded-tr-none"
                  : "bg-white dark:bg-[#202c33] text-[#111] dark:text-white rounded-tl-none"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F0F2F5] dark:bg-[#202c33] border-t border-border/30">
        {step === "idle" ? (
          <Button size="sm" className="w-full h-8 text-xs bg-[#075E54] hover:bg-[#075E54]/90" onClick={start}>
            Iniciar simulação
          </Button>
        ) : (
          <>
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Digite uma mensagem..."
              className="h-8 text-[13px] bg-white dark:bg-[#2a3942] border-0 rounded-full"
            />
            <button
              onClick={send}
              className="size-8 flex items-center justify-center rounded-full bg-[#075E54] text-white shrink-0"
            >
              <Send className="size-3.5" />
            </button>
            <button
              onClick={reset}
              title="Reiniciar"
              className="size-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export function ChatbotConfigTab({ profile }: ChatbotConfigTabProps) {
  const parseMenu = (): MenuOption[] => {
    try {
      const parsed = JSON.parse(profile?.chatbotMenu ?? "[]")
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const [isPending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(profile?.chatbotEnabled ?? false)
  const [nome, setNome] = useState(profile?.chatbotNome ?? "")
  const [nicho, setNicho] = useState(profile?.chatbotNicho ?? "")
  const [saudacao, setSaudacao] = useState(profile?.chatbotSaudacao ?? "")
  const [horario, setHorario] = useState(profile?.chatbotHorario ?? "")
  const [contato, setContato] = useState(profile?.chatbotContato ?? "")
  const [opcoes, setOpcoes] = useState<MenuOption[]>(parseMenu)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitulo, setEditTitulo] = useState("")
  const [editResposta, setEditResposta] = useState("")

  function applyTemplate(n: string) {
    const t = TEMPLATES[n]
    if (!t) return
    setSaudacao(t.saudacao)
    setHorario(t.horario)
    setOpcoes(t.opcoes)
    toast.success("Template aplicado! Personalize como preferir.")
  }

  function addOpcao() {
    const newId = crypto.randomUUID()
    setOpcoes(prev => [
      ...prev,
      { id: newId, titulo: "Nova opção", resposta: "Resposta automática para esta opção." },
    ])
    setEditingId(newId)
    setEditTitulo("Nova opção")
    setEditResposta("Resposta automática para esta opção.")
  }

  function removeOpcao(id: string) {
    setOpcoes(prev => prev.filter(o => o.id !== id))
  }

  function startEdit(o: MenuOption) {
    setEditingId(o.id)
    setEditTitulo(o.titulo)
    setEditResposta(o.resposta)
  }

  function confirmEdit() {
    setOpcoes(prev =>
      prev.map(o =>
        o.id === editingId ? { ...o, titulo: editTitulo, resposta: editResposta } : o
      )
    )
    setEditingId(null)
  }

  function save() {
    startTransition(async () => {
      try {
        await upsertBusinessProfile({
          chatbotEnabled: enabled,
          chatbotNome: nome,
          chatbotNicho: nicho,
          chatbotMenu: JSON.stringify(opcoes),
          chatbotSaudacao: saudacao,
          chatbotHorario: horario,
          chatbotContato: contato,
        })
        toast.success("Configurações do chatbot salvas!")
      } catch {
        toast.error("Erro ao salvar. Tente novamente.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header + toggle ativo */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Chatbot WhatsApp</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure um menu automático para atender seus clientes via WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{enabled ? "Ativo" : "Inativo"}</span>
          <Toggle checked={enabled} onChange={setEnabled} />
        </div>
      </div>

      {!enabled && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Ative o chatbot acima para configurar e publicar seu menu automático no WhatsApp.
          </p>
        </div>
      )}

      {enabled && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Coluna esquerda — formulário */}
          <div className="flex flex-col gap-5">

            {/* Template rápido */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">Template por nicho</CardTitle>
                <CardDescription className="text-[11px]">
                  Carregue um ponto de partida e personalize.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Select value={nicho} onValueChange={v => { setNicho(v); applyTemplate(v) }}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Selecione seu nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {NICHOS.map(n => (
                      <SelectItem key={n.value} value={n.value} className="text-xs">{n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Dados do chatbot */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">Identidade do chatbot</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Nome exibido no menu</Label>
                  <Input
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Ex: Assistência do João"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Mensagem de boas-vindas</Label>
                  <Textarea
                    value={saudacao}
                    onChange={e => setSaudacao(e.target.value)}
                    placeholder="Ex: Olá! Bem-vindo à nossa assistência. Como posso ajudar?"
                    className="text-xs min-h-[64px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Horário de atendimento</Label>
                    <Input
                      value={horario}
                      onChange={e => setHorario(e.target.value)}
                      placeholder="Seg–Sex, 8h–18h"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Contato / e-mail</Label>
                    <Input
                      value={contato}
                      onChange={e => setContato(e.target.value)}
                      placeholder="contato@empresa.com"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opções do menu */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-semibold">Opções do menu</CardTitle>
                    <CardDescription className="text-[11px]">Máximo 9 opções.</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addOpcao}
                    disabled={opcoes.length >= 9}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="size-3" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {opcoes.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Nenhuma opção ainda. Clique em Adicionar ou selecione um template.
                  </p>
                )}
                {opcoes.map((o, i) => (
                  <div key={o.id} className="rounded-lg border border-border overflow-hidden">
                    {editingId === o.id ? (
                      <div className="flex flex-col gap-2 p-3 bg-muted/30">
                        <Input
                          value={editTitulo}
                          onChange={e => setEditTitulo(e.target.value)}
                          placeholder="Título da opção"
                          className="h-7 text-xs"
                          autoFocus
                        />
                        <Textarea
                          value={editResposta}
                          onChange={e => setEditResposta(e.target.value)}
                          placeholder="Resposta automática para esta opção..."
                          className="text-xs min-h-[72px] resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => setEditingId(null)}>
                            <X className="size-3" /> Cancelar
                          </Button>
                          <Button size="sm" className="h-6 text-xs gap-1" onClick={confirmEdit}>
                            <Check className="size-3" /> Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <GripVertical className="size-3.5 text-muted-foreground/40 shrink-0" />
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
                          {i + 1}
                        </Badge>
                        <span className="text-xs flex-1 truncate">{o.titulo}</span>
                        <button onClick={() => startEdit(o)} className="text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => removeOpcao(o.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Botão salvar */}
            <Button onClick={save} disabled={isPending} className="w-full h-9">
              {isPending ? "Salvando..." : "Salvar configurações"}
            </Button>
          </div>

          {/* Coluna direita — simulador */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-foreground">Simulador — prévia do cliente</p>
              <Badge variant="secondary" className="text-[10px]">Ao vivo</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Veja exatamente como seu cliente vai interagir com o chatbot antes de ativar.
            </p>
            <ChatSimulator
              nome={nome}
              saudacao={saudacao}
              horario={horario}
              contato={contato}
              opcoes={opcoes}
            />
            {enabled && opcoes.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Chatbot ativo com {opcoes.length} {opcoes.length === 1 ? "opção" : "opções"} configuradas.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}

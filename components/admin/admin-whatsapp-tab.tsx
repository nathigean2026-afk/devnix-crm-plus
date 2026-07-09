"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  RefreshCw, XCircle, Link2Off, QrCode, Smartphone, MessageSquare,
  User, Send, Bot, UserCheck, AlertCircle, Clock, CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ZapiStatus = { connected: boolean; smartphoneConnected?: boolean; session?: string; error?: string } | null

interface ChatSession {
  id: string
  phone: string
  name: string | null
  step: string
  lastMessage: string | null
  lastReply: string | null
  messageCount: number
  humanMode: boolean
  createdAt: string
  updatedAt: string
}

interface ChatMessage {
  id: string
  sessionId: string
  direction: "in" | "out"
  text: string
  createdAt: string
}

interface Props {
  darkMode: boolean
  zapiStatus: ZapiStatus
  zapiLoading: boolean
  loadZapiStatus: () => void
  handleZapiDisconnect: () => void
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "agora"
  if (diffMins < 60) return `${diffMins}min`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h`
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function stepLabel(step: string) {
  const map: Record<string, string> = {
    welcome: "Inicio",
    awaiting_choice: "Aguardando escolha",
    done: "Concluido",
    human_requested: "Pediu atendente",
  }
  return map[step] ?? step
}

export function AdminWhatsappTab({ darkMode, zapiStatus, zapiLoading, loadZapiStatus, handleZapiDisconnect }: Props) {
  const [view, setView] = useState<"status" | "conversas">("status")
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const res = await fetch("/api/whatsapp/sessions", {
        headers: { "x-admin-token": "admin-nathigean-001" },
      })
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } catch {
      // silencioso
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  const loadMessages = useCallback(async (sessionId: string) => {
    setLoadingMsgs(true)
    try {
      const res = await fetch(`/api/whatsapp/human-mode?sessionId=${sessionId}`, {
        headers: { "x-admin-token": "admin-nathigean-001" },
      })
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      // silencioso
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  useEffect(() => {
    if (view === "conversas") loadSessions()
  }, [view, loadSessions])

  useEffect(() => {
    if (selectedSession) loadMessages(selectedSession.id)
  }, [selectedSession, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function toggleHumanMode(session: ChatSession) {
    const newMode = !session.humanMode
    await fetch("/api/whatsapp/human-mode", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": "admin-nathigean-001" },
      body: JSON.stringify({ sessionId: session.id, humanMode: newMode }),
    })
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, humanMode: newMode } : s))
    if (selectedSession?.id === session.id) {
      setSelectedSession(prev => prev ? { ...prev, humanMode: newMode } : prev)
    }
  }

  async function sendReply() {
    if (!replyText.trim() || !selectedSession) return
    setSending(true)
    try {
      await fetch("/api/whatsapp/human-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": "admin-nathigean-001" },
        body: JSON.stringify({ sessionId: selectedSession.id, text: replyText.trim() }),
      })
      setReplyText("")
      await loadMessages(selectedSession.id)
    } catch {
      // silencioso
    } finally {
      setSending(false)
    }
  }

  const card = cn("rounded-xl border p-5", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")
  const label = cn("text-xs", darkMode ? "text-white/40" : "text-slate-400")
  const title = cn("text-sm font-semibold", darkMode ? "text-white/80" : "text-slate-700")

  return (
    <div className="space-y-4">
      {/* Abas internas */}
      <div className="flex gap-1">
        {(["status", "conversas"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
              view === v
                ? darkMode ? "bg-white/10 text-white" : "bg-slate-900 text-white"
                : darkMode ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            {v === "status" ? "Status Wame" : `Conversas${sessions.length ? ` (${sessions.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* ── View: Status ─────────────────────────────────────────────────── */}
      {view === "status" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>
                WhatsApp via Wame API
              </h2>
              <p className={cn("text-xs mt-0.5", darkMode ? "text-white/30" : "text-slate-400")}>
                Instancia conectada ao numero da Elevanthe
              </p>
            </div>
            <button
              onClick={loadZapiStatus}
              disabled={zapiLoading}
              className={cn("flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border transition-colors", darkMode ? "border-white/10 text-white/70 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
            >
              <RefreshCw className={cn("size-3.5", zapiLoading && "animate-spin")} />
              Atualizar
            </button>
          </div>

          <div className={card}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn("size-10 rounded-xl flex items-center justify-center", "bg-emerald-500/15")}>
                  <Smartphone className="size-5 text-emerald-400" />
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", darkMode ? "text-white" : "text-slate-800")}>
                    Conectado
                  </p>
                  <p className={cn("text-xs mt-0.5", darkMode ? "text-white/40" : "text-slate-400")}>
                    Instancia Wame ativa
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          </div>

          <div className={card}>
            <div className="flex items-center gap-2 mb-3">
              <Bot className={cn("size-4", darkMode ? "text-white/50" : "text-slate-500")} />
              <h3 className={title}>Chatbot Central Elevanthe</h3>
            </div>
            <ul className="space-y-2">
              {[
                "O webhook recebe mensagens enviadas ao numero da Elevanthe.",
                "Prestadores cadastrados sao identificados e ignorados automaticamente.",
                "Contatos externos recebem o menu automatico de boas-vindas.",
                "Configure o webhook no painel Wame com a URL abaixo.",
                "O admin pode assumir a conversa manualmente na aba Conversas.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={cn("size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                    darkMode ? "bg-white/8 text-white/50" : "bg-slate-100 text-slate-500"
                  )}>{i + 1}</span>
                  <span className={cn("text-xs leading-relaxed", darkMode ? "text-white/50" : "text-slate-500")}>{step}</span>
                </li>
              ))}
            </ul>
            <div className={cn("mt-4 pt-4 border-t rounded-lg px-3 py-2 font-mono text-xs select-all", darkMode ? "border-white/5 bg-white/5 text-emerald-400" : "border-slate-100 bg-slate-50 text-slate-700")}>
              URL do Webhook: /api/whatsapp/webhook
            </div>
          </div>
        </div>
      )}

      {/* ── View: Conversas ───────────────────────────────────────────────── */}
      {view === "conversas" && (
        <div className="flex gap-3 h-[520px]">
          {/* Lista de sessoes */}
          <div className={cn("w-56 shrink-0 rounded-xl border flex flex-col", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0" style={{ borderColor: darkMode ? "rgba(255,255,255,0.06)" : "#e2e8f0" }}>
              <span className={cn("text-xs font-semibold uppercase tracking-wider", darkMode ? "text-white/50" : "text-slate-400")}>Contatos</span>
              <button onClick={loadSessions} disabled={loadingSessions} className={cn("text-xs", darkMode ? "text-white/30 hover:text-white/60" : "text-slate-400 hover:text-slate-700")}>
                <RefreshCw className={cn("size-3", loadingSessions && "animate-spin")} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 && !loadingSessions && (
                <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
                  <MessageSquare className={cn("size-6", darkMode ? "text-white/15" : "text-slate-200")} />
                  <p className={cn("text-xs", darkMode ? "text-white/25" : "text-slate-400")}>Nenhuma conversa ainda</p>
                </div>
              )}
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSession(s)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 border-b transition-colors",
                    selectedSession?.id === s.id
                      ? darkMode ? "bg-white/8" : "bg-slate-50"
                      : darkMode ? "hover:bg-white/5" : "hover:bg-slate-50/80",
                    darkMode ? "border-white/5" : "border-slate-100"
                  )}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className={cn("size-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                      s.humanMode ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                    )}>
                      {s.humanMode ? <UserCheck className="size-3" /> : <Bot className="size-3" />}
                    </div>
                    <span className={cn("text-xs font-medium truncate flex-1", darkMode ? "text-white/80" : "text-slate-700")}>
                      {s.name ?? s.phone.slice(-8)}
                    </span>
                    <span className={cn("text-[10px] shrink-0", darkMode ? "text-white/25" : "text-slate-400")}>
                      {formatTime(s.updatedAt)}
                    </span>
                  </div>
                  <p className={cn("text-[11px] truncate pl-8", darkMode ? "text-white/30" : "text-slate-400")}>
                    {s.lastMessage ?? "Sem mensagens"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className={cn("flex-1 rounded-xl border flex flex-col min-w-0", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")}>
            {!selectedSession ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <MessageSquare className={cn("size-8", darkMode ? "text-white/10" : "text-slate-200")} />
                <p className={cn("text-sm", darkMode ? "text-white/25" : "text-slate-400")}>Selecione uma conversa</p>
              </div>
            ) : (
              <>
                {/* Header do chat */}
                <div className={cn("px-4 py-3 border-b flex items-center justify-between shrink-0", darkMode ? "border-white/6" : "border-slate-100")}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0",
                      selectedSession.humanMode ? "bg-amber-500/20" : "bg-emerald-500/15"
                    )}>
                      <User className={cn("size-4", selectedSession.humanMode ? "text-amber-400" : "text-emerald-400")} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-semibold truncate", darkMode ? "text-white" : "text-slate-800")}>
                        {selectedSession.name ?? "Desconhecido"}
                      </p>
                      <p className={cn("text-[11px]", darkMode ? "text-white/35" : "text-slate-400")}>
                        {selectedSession.phone} · {stepLabel(selectedSession.step)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleHumanMode(selectedSession)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0",
                      selectedSession.humanMode
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        : darkMode
                          ? "border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {selectedSession.humanMode ? <Bot className="size-3" /> : <UserCheck className="size-3" />}
                    {selectedSession.humanMode ? "Passar para bot" : "Assumir conversa"}
                  </button>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {loadingMsgs && (
                    <div className="flex justify-center pt-4">
                      <RefreshCw className={cn("size-4 animate-spin", darkMode ? "text-white/30" : "text-slate-300")} />
                    </div>
                  )}
                  {messages.map(m => (
                    <div key={m.id} className={cn("flex", m.direction === "out" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap",
                        m.direction === "out"
                          ? "bg-emerald-600 text-white rounded-br-sm"
                          : darkMode
                            ? "bg-white/8 text-white/80 rounded-bl-sm"
                            : "bg-slate-100 text-slate-700 rounded-bl-sm"
                      )}>
                        {m.text}
                        <span className={cn("block text-[10px] mt-0.5 opacity-60 text-right")}>
                          {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input de resposta — so disponivel no modo humano */}
                {selectedSession.humanMode ? (
                  <div className={cn("p-3 border-t flex gap-2 shrink-0", darkMode ? "border-white/6" : "border-slate-100")}>
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); sendReply() } }}
                      placeholder="Digite sua mensagem..."
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-xs border outline-none transition-colors",
                        darkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/20" : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-slate-300"
                      )}
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending || !replyText.trim()}
                      className="shrink-0 size-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center transition-colors"
                    >
                      <Send className="size-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className={cn("px-4 py-2.5 border-t flex items-center gap-2 shrink-0", darkMode ? "border-white/6" : "border-slate-100")}>
                    <Bot className={cn("size-3.5 shrink-0", darkMode ? "text-white/25" : "text-slate-300")} />
                    <p className={cn("text-[11px]", darkMode ? "text-white/30" : "text-slate-400")}>
                      Bot esta respondendo automaticamente. Clique em "Assumir conversa" para responder manualmente.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

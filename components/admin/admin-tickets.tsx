"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  ChevronLeft, Search, Filter, Send, Paperclip, Loader2,
  FileText, Image as ImageIcon, X, Clock, CheckCircle2,
  PauseCircle, XCircle, AlertCircle, Users,
} from "lucide-react"
import { toast } from "sonner"
import { adminGetTicket, adminReplyTicket, adminUpdateTicketStatus } from "@/lib/actions"
import { put } from "@vercel/blob"

// ── Tipos ──────────────────────────────────────────────────────────────────────
type TicketRow = {
  id: string; subject: string; category: string; status: string; priority: string
  createdAt: Date; updatedAt: Date; userId: string; userName: string | null; userEmail: string | null
}
type MsgRow = {
  id: string; body: string; authorRole: string; attachments: string | null; createdAt: Date
}
type Attachment = { name: string; url: string }

// ── Configurações ──────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; icon: React.ElementType; dot: string; badge: string }> = {
  aberto:       { label: "Aberto",       icon: AlertCircle,    dot: "bg-red-400",    badge: "bg-red-500/20 text-red-300 border-red-500/30" },
  em_andamento: { label: "Em andamento", icon: Clock,          dot: "bg-blue-400",   badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  pausado:      { label: "Pausado",      icon: PauseCircle,    dot: "bg-yellow-400", badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  resolvido:    { label: "Resolvido",    icon: CheckCircle2,   dot: "bg-emerald-400", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  fechado:      { label: "Fechado",      icon: XCircle,        dot: "bg-white/20",   badge: "bg-white/10 text-white/40 border-white/10" },
}
const CATEGORY_LABELS: Record<string, string> = {
  tecnico: "Técnico", financeiro: "Financeiro", conta: "Conta",
  sugestao: "Sugestão", outro: "Outro",
}
const PRIORITY_CLS: Record<string, string> = {
  baixa: "text-white/40", media: "text-yellow-400", alta: "text-orange-400", urgente: "text-red-400",
}

function isImage(name: string) { return /\.(png|jpg|jpeg|gif|webp)$/i.test(name) }

function AttachmentPreview({ a }: { a: Attachment }) {
  if (isImage(a.name)) {
    return (
      <a href={a.url} target="_blank" rel="noreferrer" className="block mt-2">
        <img src={a.url} alt={a.name} crossOrigin="anonymous" className="max-h-48 rounded-lg border border-white/10 object-cover" />
      </a>
    )
  }
  return (
    <a href={a.url} target="_blank" rel="noreferrer"
      className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white">
      <FileText className="size-3.5 shrink-0" />
      <span className="truncate">{a.name}</span>
    </a>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
interface AdminTicketsProps { initialTickets: TicketRow[] }

export function AdminTickets({ initialTickets }: AdminTicketsProps) {
  const [tickets, setTickets] = useState<TicketRow[]>(initialTickets)
  const [selected, setSelected] = useState<TicketRow | null>(null)
  const [messages, setMessages] = useState<MsgRow[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastTs = useRef<string | undefined>(undefined)

  async function openTicket(t: TicketRow) {
    setSelected(t)
    setLoadingMessages(true)
    setMessages([])
    try {
      const { messages: msgs } = await adminGetTicket(t.id)
      setMessages(msgs as MsgRow[])
      if (msgs.length > 0) lastTs.current = msgs[msgs.length - 1].createdAt.toISOString()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch { toast.error("Erro ao carregar mensagens") }
    finally { setLoadingMessages(false) }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const uploaded: Attachment[] = []
      for (const file of files) {
        const blob = await put(`support/${Date.now()}-${file.name}`, file, { access: "public" })
        uploaded.push({ name: file.name, url: blob.url })
      }
      setAttachments(prev => [...prev, ...uploaded])
    } catch { toast.error("Erro no upload") }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = "" }
  }

  async function handleReply() {
    if (!selected || (!reply.trim() && attachments.length === 0)) return
    setSending(true)
    try {
      // adminReplyTicket(ticketId, body, attachments[])
      await adminReplyTicket(
        selected.id,
        reply.trim() || "(anexo)",
        attachments,
      )
      // Recarrega mensagens após envio
      const { messages: refreshed } = await adminGetTicket(selected.id)
      setMessages(refreshed as MsgRow[])
      if (refreshed.length > 0) lastTs.current = refreshed[refreshed.length - 1].createdAt.toISOString()
      setReply(""); setAttachments([])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      toast.success("Resposta enviada")
    } catch (err: any) { toast.error(err?.message ?? "Erro ao enviar") }
    finally { setSending(false) }
  }

  async function handleStatusChange(status: string) {
    if (!selected) return
    try {
      await adminUpdateTicketStatus(selected.id, status as any)
      setSelected(prev => prev ? { ...prev, status } : prev)
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status } : t))
      toast.success(`Status: ${STATUS_CFG[status]?.label}`)
    } catch { toast.error("Erro ao atualizar status") }
  }

  const filtered = tickets.filter(t => {
    const matchStatus = statusFilter === "todos" || t.status === statusFilter
    const matchSearch = !search ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.userName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.userEmail ?? "").toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  // ── Vista de conversa ──────────────────────────────────────────────────────
  if (selected) {
    const s = STATUS_CFG[selected.status] ?? STATUS_CFG.aberto
    const StatusIcon = s.icon
    const closed = selected.status === "fechado" || selected.status === "resolvido"

    return (
      <div className="flex flex-col" style={{ minHeight: 480 }}>
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 p-4 bg-white/3">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-3 transition-colors"
          >
            <ChevronLeft className="size-4" />Voltar aos tickets
          </button>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-white break-words">{selected.subject}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <span className={cn("inline-flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1 font-medium", s.badge)}>
                  <StatusIcon className="size-3" />{s.label}
                </span>
                <span className="text-xs text-white/40">{CATEGORY_LABELS[selected.category]}</span>
                <span className="text-xs text-white/60 font-medium">{selected.userName ?? selected.userEmail ?? "—"}</span>
                <span className="text-xs text-white/30">{new Date(selected.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
            {/* Alterar status — select nativo para evitar dependencia de tokens CSS */}
            <select
              value={selected.status}
              onChange={e => handleStatusChange(e.target.value)}
              className="rounded-lg border border-white/15 bg-[#1a1a2e] text-white/80 text-xs px-3 py-1.5 h-8 outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em andamento</option>
              <option value="pausado">Pausado</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: "rgba(255,255,255,0.02)" }}>
          {loadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-white/30" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-white/30 py-12">Nenhuma mensagem ainda.</p>
          ) : (
            messages.map(m => {
              const isAdmin = m.authorRole === "admin"
              const atts: Attachment[] = (() => { try { return JSON.parse(m.attachments ?? "[]") } catch { return [] } })()
              return (
                <div key={m.id} className={cn("flex gap-3", isAdmin ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "size-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
                    isAdmin ? "bg-primary text-white" : "bg-amber-500/80 text-white"
                  )}>
                    {isAdmin ? "A" : (selected.userName?.charAt(0).toUpperCase() ?? "U")}
                  </div>
                  <div className={cn("flex flex-col max-w-[75%]", isAdmin ? "items-end" : "items-start")}>
                    <span className="text-xs text-white/30 mb-1">
                      {isAdmin ? "Suporte Elevanthe" : (selected.userName ?? "Usuário")} •{" "}
                      {new Date(m.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isAdmin
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-white/8 text-white/90 rounded-tl-sm"
                    )}>
                      {m.body !== "(anexo)" && <p className="whitespace-pre-wrap">{m.body}</p>}
                      {atts.map((a, i) => <AttachmentPreview key={i} a={a} />)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input de resposta */}
        {closed ? (
          <div className="p-4 border-t border-white/10 text-center text-sm text-white/30 bg-white/2">
            Ticket {STATUS_CFG[selected.status]?.label.toLowerCase()}. Altere o status para responder.
          </div>
        ) : (
          <div className="shrink-0 border-t border-white/10 p-4 bg-white/3">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                    {isImage(a.name) ? <ImageIcon className="size-3" /> : <FileText className="size-3" />}
                    <span className="max-w-24 truncate">{a.name}</span>
                    <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))}>
                      <X className="size-3 text-white/40 hover:text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx,.txt,.zip" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="shrink-0 size-9 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
              </button>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply() } }}
                placeholder="Responder ao usuário... (Enter para enviar)"
                rows={1}
                className="flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/50 min-h-[36px] max-h-32"
              />
              <button
                onClick={handleReply}
                disabled={sending || (!reply.trim() && attachments.length === 0)}
                className="shrink-0 size-9 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-40"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Lista de tickets ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Contadores por status */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.entries(STATUS_CFG).map(([key, cfg]) => {
          const count = tickets.filter(t => t.status === key).length
          const Icon = cfg.icon
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "todos" : key)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                statusFilter === key
                  ? "border-primary/50 bg-primary/10"
                  : "border-white/10 bg-white/3 hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("size-2 rounded-full", cfg.dot)} />
                <span className="text-xs text-white/40">{cfg.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{count}</p>
            </button>
          )
        })}
      </div>

      {/* Busca e filtro */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por assunto, nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 text-white/70 text-sm px-3 py-2 outline-none focus:border-primary/50 cursor-pointer"
        >
          <option value="todos">Todos</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 flex flex-col items-center py-16 gap-3">
          <Users className="size-8 text-white/20" />
          <p className="text-sm text-white/30">Nenhum ticket encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const s = STATUS_CFG[t.status] ?? STATUS_CFG.aberto
            const Icon = s.icon
            return (
              <button
                key={t.id}
                onClick={() => openTicket(t)}
                className="w-full rounded-xl border border-white/10 bg-white/3 hover:border-primary/40 hover:bg-white/5 transition-all p-4 flex items-center gap-4 text-left"
              >
                <div className={cn("size-9 rounded-lg border flex items-center justify-center shrink-0", s.badge)}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">{t.subject}</span>
                    <span className={cn("text-xs font-medium capitalize", PRIORITY_CLS[t.priority])}>{t.priority}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("text-xs border rounded-full px-2 py-0.5", s.badge)}>{s.label}</span>
                    <span className="text-xs text-white/30">{CATEGORY_LABELS[t.category]}</span>
                    <span className="text-xs text-white/50 font-medium">{t.userName ?? t.userEmail ?? "—"}</span>
                    <span className="text-xs text-white/25">{new Date(t.updatedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <ChevronLeft className="size-4 text-white/20 shrink-0 rotate-180" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

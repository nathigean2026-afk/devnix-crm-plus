"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  AlertCircle, Clock, PauseCircle, CheckCircle2, XCircle,
  ChevronLeft, Send, Paperclip, FileText, Image as ImageIcon,
  Download, Loader2, Users, Filter, Search, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { adminReplyTicket, adminUpdateTicketStatus } from "@/lib/actions"
import { cn } from "@/lib/utils"

type Attachment = { name: string; url: string }

type Ticket = {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  createdAt: Date
  updatedAt: Date
  userId: string
  userName: string | null
  userEmail: string | null
}

type Message = {
  id: string
  ticketId: string
  authorId: string
  authorRole: string
  body: string
  attachments: string | null
  createdAt: Date
}

const STATUS_CFG: Record<string, { label: string; icon: any; cls: string; dot: string }> = {
  aberto:       { label: "Aberto",       icon: AlertCircle,  cls: "bg-blue-500/15 text-blue-500 border-blue-500/30",      dot: "bg-blue-500" },
  em_andamento: { label: "Em andamento", icon: Clock,        cls: "bg-amber-500/15 text-amber-500 border-amber-500/30",   dot: "bg-amber-500" },
  pausado:      { label: "Pausado",      icon: PauseCircle,  cls: "bg-muted text-muted-foreground border-border",         dot: "bg-muted-foreground" },
  resolvido:    { label: "Resolvido",    icon: CheckCircle2, cls: "bg-green-500/15 text-green-600 border-green-500/30",   dot: "bg-green-500" },
  fechado:      { label: "Fechado",      icon: XCircle,      cls: "bg-destructive/15 text-destructive border-destructive/30", dot: "bg-destructive" },
}

const CATEGORY_LABELS: Record<string, string> = {
  duvida: "Dúvida", bug: "Bug / Erro", financeiro: "Financeiro",
  conta: "Conta", sugestao: "Sugestão", outro: "Outro",
}

const PRIORITY_CLS: Record<string, string> = {
  baixa: "text-muted-foreground", normal: "text-amber-500", alta: "text-destructive",
}

function isImage(name: string) {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)
}

function AttachmentPreview({ a }: { a: Attachment }) {
  if (isImage(a.name)) {
    return (
      <a href={a.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img src={a.url} alt={a.name} className="max-h-36 rounded-lg border border-border object-cover" />
      </a>
    )
  }
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm hover:bg-muted transition-colors"
    >
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate text-foreground">{a.name}</span>
      <Download className="size-3.5 ml-auto shrink-0 text-muted-foreground" />
    </a>
  )
}

interface AdminTicketsProps {
  initialTickets: Ticket[]
}

export function AdminTickets({ initialTickets }: AdminTicketsProps) {
  const [tickets] = useState<Ticket[]>(initialTickets)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [reply, setReply] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastTs = useRef<string>(new Date(0).toISOString())

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => { scrollToBottom() }, [messages])

  async function openTicket(t: Ticket) {
    setSelected(t)
    setLoadingMessages(true)
    lastTs.current = new Date(0).toISOString()
    try {
      const res = await fetch(`/api/admin/support/messages?ticketId=${t.id}`)
      const msgs: Message[] = await res.json()
      setMessages(msgs)
      if (msgs.length > 0) lastTs.current = new Date(msgs.at(-1)!.createdAt).toISOString()
    } catch {
      toast.error("Erro ao carregar mensagens")
    } finally {
      setLoadingMessages(false)
    }
  }

  // Polling a cada 5s enquanto um ticket está aberto
  const poll = useCallback(async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/admin/support/messages?ticketId=${selected.id}&after=${encodeURIComponent(lastTs.current)}`)
      if (!res.ok) return
      const news: Message[] = await res.json()
      if (news.length > 0) {
        setMessages((prev) => [...prev, ...news])
        lastTs.current = new Date(news.at(-1)!.createdAt).toISOString()
      }
    } catch {}
  }, [selected])

  useEffect(() => {
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [poll])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const results: Attachment[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/support/upload", { method: "POST", body: fd })
        if (!res.ok) throw new Error(await res.text())
        results.push({ name: file.name, url: (await res.json()).url })
      }
      setAttachments((prev) => [...prev, ...results])
      toast.success("Arquivo(s) anexado(s)")
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar arquivo")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleReply() {
    if (!selected || (!reply.trim() && attachments.length === 0)) return
    setSending(true)
    try {
      await adminReplyTicket(selected.id, reply.trim() || "(anexo)", attachments)
      const newMsg: Message = {
        id: crypto.randomUUID(),
        ticketId: selected.id,
        authorId: "admin",
        authorRole: "admin",
        body: reply.trim() || "(anexo)",
        attachments: JSON.stringify(attachments),
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, newMsg])
      lastTs.current = newMsg.createdAt.toISOString()
      setReply("")
      setAttachments([])
      toast.success("Resposta enviada")
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar resposta")
    } finally {
      setSending(false)
    }
  }

  async function handleStatusChange(status: string) {
    if (!selected) return
    try {
      await adminUpdateTicketStatus(selected.id, status as any)
      setSelected((prev) => prev ? { ...prev, status } : prev)
      toast.success(`Status atualizado para "${STATUS_CFG[status]?.label}"`)
    } catch {
      toast.error("Erro ao atualizar status")
    }
  }

  const filtered = tickets.filter((t) => {
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
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="shrink-0 border-b border-border p-4 bg-card">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ChevronLeft className="size-4" />Voltar aos tickets
          </button>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-foreground break-words">{selected.subject}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <span className={cn("inline-flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1 font-medium", s.cls)}>
                  <StatusIcon className="size-3" />
                  {s.label}
                </span>
                <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[selected.category]}</span>
                <span className="text-xs text-muted-foreground font-medium">{selected.userName ?? selected.userEmail ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
            {/* Alterar status */}
            <Select value={selected.status} onValueChange={(v: string | null) => { if (v) handleStatusChange(v) }}>
              <SelectTrigger className="w-40 bg-input border-border text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/40">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">Nenhuma mensagem ainda.</p>
          ) : (
            messages.map((m) => {
              const isAdmin = m.authorRole === "admin"
              const atts: Attachment[] = (() => { try { return JSON.parse(m.attachments ?? "[]") } catch { return [] } })()
              return (
                <div key={m.id} className={cn("flex gap-3", isAdmin ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "size-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
                    isAdmin ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"
                  )}>
                    {isAdmin ? "A" : (selected.userName?.charAt(0).toUpperCase() ?? "U")}
                  </div>
                  <div className={cn("flex flex-col max-w-[75%]", isAdmin ? "items-end" : "items-start")}>
                    <span className="text-xs text-muted-foreground mb-1">
                      {isAdmin ? "Suporte Devnix" : (selected.userName ?? "Usuário")} •{" "}
                      {new Date(m.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isAdmin
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
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
          <div className="p-4 border-t border-border text-center text-sm text-muted-foreground bg-muted/30">
            Ticket {STATUS_CFG[selected.status]?.label.toLowerCase()}. Altere o status para responder.
          </div>
        ) : (
          <div className="shrink-0 border-t border-border p-4 bg-card">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                    {isImage(a.name) ? <ImageIcon className="size-3" /> : <FileText className="size-3" />}
                    <span className="max-w-24 truncate">{a.name}</span>
                    <button onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}>
                      <X className="size-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx,.txt,.zip" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
              </Button>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply() } }}
                placeholder="Responder ao usuário... (Enter para enviar)"
                className="resize-none min-h-[40px] max-h-32 text-sm bg-input border-border"
                rows={1}
              />
              <Button
                onClick={handleReply}
                disabled={sending || (!reply.trim() && attachments.length === 0)}
                className="shrink-0"
                size="icon"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
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
          const count = tickets.filter((t) => t.status === key).length
          const Icon = cfg.icon
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "todos" : key)}
              className={cn(
                "rounded-xl border border-border p-3 text-left transition-all hover:border-primary/40",
                statusFilter === key && "border-primary/50 ring-1 ring-primary/30"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("size-2 rounded-full", cfg.dot)} />
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{count}</p>
            </button>
          )
        })}
      </div>

      {/* Busca e filtro */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por assunto, nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: string | null) => { if (v) setStatusFilter(v) }}>
          <SelectTrigger className="w-36 bg-input border-border">
            <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela / lista */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border flex flex-col items-center py-16 gap-3">
          <Users className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum ticket encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const s = STATUS_CFG[t.status] ?? STATUS_CFG.aberto
            const Icon = s.icon
            return (
              <button
                key={t.id}
                onClick={() => openTicket(t)}
                className="w-full rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/20 transition-all p-4 flex items-center gap-4 text-left"
              >
                <div className={cn("size-9 rounded-lg border flex items-center justify-center shrink-0", s.cls)}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">{t.subject}</span>
                    <span className={cn("text-xs font-medium", PRIORITY_CLS[t.priority])}>{t.priority}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("text-xs border rounded-full px-2 py-0.5", s.cls)}>{s.label}</span>
                    <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[t.category]}</span>
                    <span className="text-xs text-muted-foreground font-medium">{t.userName ?? t.userEmail ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <ChevronLeft className="size-4 text-muted-foreground shrink-0 rotate-180" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

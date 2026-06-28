"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  ChevronLeft, Search, Send, Paperclip, Loader2,
  FileText, Image as ImageIcon, X, Clock, CheckCircle2,
  PauseCircle, XCircle, AlertCircle, Users, AlertTriangle,
  MapPin, Wifi, Globe,
} from "lucide-react"
import { toast } from "sonner"
import { adminGetTicket, adminReplyTicket, adminUpdateTicketStatus } from "@/lib/actions"
import { put } from "@vercel/blob"

// ── Tipos ──────────────────────────────────────────────────────────────────────
type TicketRow = {
  id: string; subject: string; category: string; status: string; priority: string
  createdAt: Date; updatedAt: Date; userId: string; userName: string | null; userEmail: string | null
  licensePlan?: string | null
  userIp?: string | null
}

type GeoInfo = { city: string; region: string; isp: string; country: string }

function getPlanBadge(plan: string | null | undefined) {
  const p = (plan ?? "starter").toLowerCase()
  if (p === "enterprise") return { label: "Suporte VIP", cls: "bg-purple-500/20 text-purple-400 border-purple-500/30" }
  if (p === "business")   return { label: "Suporte Prioritário", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
  return null
}

function _p(n: number) { return String(n).padStart(2, "0") }
function fmtDate(d: Date | string) {
  const dt = new Date(d)
  return `${_p(dt.getUTCDate())}/${_p(dt.getUTCMonth() + 1)}/${dt.getUTCFullYear()}`
}
function fmtDateTime(d: Date | string) {
  const dt = new Date(d)
  return `${_p(dt.getUTCDate())}/${_p(dt.getUTCMonth() + 1)}, ${_p(dt.getUTCHours())}:${_p(dt.getUTCMinutes())}`
}

/** Retorna quantos dias o ticket tem desde criação (pode ser fracionado) */
function daysSince(d: Date | string): number {
  return (Date.now() - new Date(d).getTime()) / 86400000
}

type MsgRow = {
  id: string; body: string; authorRole: string; attachments: string | null; createdAt: Date
}
type Attachment = { name: string; url: string }

// ── Configurações ──────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; icon: React.ElementType; dot: string; badge: string; lightBadge: string }> = {
  aberto:       { label: "Aberto",       icon: AlertCircle,  dot: "bg-red-400",     badge: "bg-red-500/15 text-red-400 border-red-500/25",       lightBadge: "bg-red-50 text-red-600 border-red-200" },
  em_andamento: { label: "Em andamento", icon: Clock,        dot: "bg-blue-400",    badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",     lightBadge: "bg-blue-50 text-blue-600 border-blue-200" },
  pausado:      { label: "Pausado",      icon: PauseCircle,  dot: "bg-yellow-400",  badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25", lightBadge: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  resolvido:    { label: "Resolvido",    icon: CheckCircle2, dot: "bg-emerald-400", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", lightBadge: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  fechado:      { label: "Fechado",      icon: XCircle,      dot: "bg-slate-400",   badge: "bg-slate-500/10 text-slate-400 border-slate-500/15",  lightBadge: "bg-slate-100 text-slate-500 border-slate-200" },
}

const CATEGORY_LABELS: Record<string, string> = {
  tecnico: "Técnico", financeiro: "Financeiro", conta: "Conta",
  sugestao: "Sugestão", outro: "Outro",
}

const PRIORITY_CLS_DARK: Record<string, string> = {
  baixa: "text-white/40", media: "text-yellow-400", alta: "text-orange-400", urgente: "text-red-400",
}
const PRIORITY_CLS_LIGHT: Record<string, string> = {
  baixa: "text-slate-400", media: "text-amber-600", alta: "text-orange-600", urgente: "text-red-600",
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
interface AdminTicketsProps {
  initialTickets: TicketRow[]
  darkMode?: boolean
}

export function AdminTickets({ initialTickets, darkMode = true }: AdminTicketsProps) {
  const [tickets, setTickets] = useState<TicketRow[]>(initialTickets)
  const [selected, setSelected] = useState<TicketRow | null>(null)
  const [messages, setMessages] = useState<MsgRow[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ativos") // default: somente ativos
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [geoData, setGeoData] = useState<Record<string, GeoInfo>>({})

  // Status considerados "pendentes" (que precisam de atenção)
  const PENDING_STATUSES = ["aberto", "em_andamento", "pausado"]
  const CLOSED_STATUSES  = ["resolvido", "fechado"]

  // Carrega geo dos IPs dos tickets
  useEffect(() => {
    const ips = tickets
      .map(t => t.userIp)
      .filter((ip): ip is string => !!ip)
      .filter((ip, i, a) => a.indexOf(ip) === i)
    if (ips.length === 0) return
    fetch("/api/admin/geoip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ips }),
    }).then(r => r.ok ? r.json() : null).then(d => { if (d) setGeoData(d) }).catch(() => {})
  }, [tickets])

  async function openTicket(t: TicketRow) {
    setSelected(t)
    setLoadingMessages(true)
    setMessages([])
    try {
      const { messages: msgs } = await adminGetTicket(t.id)
      setMessages(msgs as MsgRow[])
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
      await adminReplyTicket(selected.id, reply.trim() || "(anexo)", attachments)
      const { messages: refreshed } = await adminGetTicket(selected.id)
      setMessages(refreshed as MsgRow[])
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

  // Tickets filtrados pelo search + statusFilter
  const getFiltered = (statusList?: string[]) => tickets.filter(t => {
    const matchStatus = statusList
      ? statusList.includes(t.status)
      : (statusFilter === "todos" || t.status === statusFilter)
    const matchSearch = !search ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.userName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.userEmail ?? "").toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const pendingTickets  = getFiltered(PENDING_STATUSES)
  const closedTickets   = getFiltered(CLOSED_STATUSES)

  // ── Vista de conversa ──────────────────────────────────────────────────────
  if (selected) {
    const s = STATUS_CFG[selected.status] ?? STATUS_CFG.aberto
    const StatusIcon = s.icon
    const closed = selected.status === "fechado" || selected.status === "resolvido"
    const geo = selected.userIp ? geoData[selected.userIp] : null

    return (
      <div className="flex flex-col" style={{ minHeight: 480 }}>
        {/* Header */}
        <div className={cn("shrink-0 border-b p-4", darkMode ? "border-white/10 bg-white/3" : "border-slate-200 bg-slate-50")}>
          <button
            onClick={() => setSelected(null)}
            className={cn("flex items-center gap-1 text-sm mb-3 transition-colors", darkMode ? "text-white/50 hover:text-white" : "text-slate-400 hover:text-slate-700")}
          >
            <ChevronLeft className="size-4" />Voltar aos tickets
          </button>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <h2 className={cn("text-base font-bold break-words", darkMode ? "text-white" : "text-slate-800")}>{selected.subject}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <span className={cn("inline-flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1 font-medium", darkMode ? s.badge : s.lightBadge)}>
                  <StatusIcon className="size-3" />{s.label}
                </span>
                {(() => {
                  const pb = getPlanBadge(selected.licensePlan)
                  return pb ? <span className={cn("inline-flex items-center text-xs border rounded-full px-2.5 py-1 font-medium", pb.cls)}>{pb.label}</span> : null
                })()}
                <span className={cn("text-xs", darkMode ? "text-white/40" : "text-slate-400")}>{CATEGORY_LABELS[selected.category]}</span>
                <span className={cn("text-xs font-medium", darkMode ? "text-white/60" : "text-slate-600")}>{selected.userName ?? selected.userEmail ?? "—"}</span>
                <span className={cn("text-xs", darkMode ? "text-white/30" : "text-slate-400")}>{fmtDate(selected.createdAt)}</span>
              </div>
              {/* IP + Geo */}
              {selected.userIp && (
                <div className={cn("flex items-center gap-3 mt-2 flex-wrap text-xs", darkMode ? "text-white/35" : "text-slate-400")}>
                  <span className="flex items-center gap-1">
                    <Globe className="size-3" />
                    <span className="font-mono">{selected.userIp.replace(/^::ffff:/, "")}</span>
                  </span>
                  {geo && (
                    <>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {geo.city}{geo.region ? `, ${geo.region}` : ""}{geo.country ? ` (${geo.country})` : ""}
                      </span>
                      {geo.isp && (
                        <span className="flex items-center gap-1">
                          <Wifi className="size-3" />
                          {geo.isp}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <select
              value={selected.status}
              onChange={e => handleStatusChange(e.target.value)}
              className={cn(
                "rounded-lg border text-xs px-3 py-1.5 h-8 outline-none cursor-pointer",
                darkMode ? "border-white/15 bg-[#1a1a2e] text-white/80 focus:border-primary/50" : "border-slate-200 bg-white text-slate-700 focus:border-primary/50"
              )}
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
        <div className={cn("flex-1 overflow-y-auto p-4 space-y-4", darkMode ? "bg-white/2" : "bg-slate-50/50")} style={{ minHeight: 300 }}>
          {loadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-white/30" />
            </div>
          ) : messages.length === 0 ? (
            <p className={cn("text-center text-sm py-12", darkMode ? "text-white/30" : "text-slate-400")}>Nenhuma mensagem ainda.</p>
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
                    <span className={cn("text-xs mb-1", darkMode ? "text-white/30" : "text-slate-400")}>
                      {isAdmin ? "Suporte Elevanthe" : (selected.userName ?? "Usuário")} • {fmtDateTime(m.createdAt)}
                    </span>
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isAdmin
                        ? "bg-primary text-white rounded-tr-sm"
                        : darkMode ? "bg-white/8 text-white/90 rounded-tl-sm" : "bg-white text-slate-700 border border-slate-200 rounded-tl-sm"
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
          <div className={cn("p-4 border-t text-center text-sm", darkMode ? "border-white/10 text-white/30 bg-white/2" : "border-slate-200 text-slate-400 bg-slate-50")}>
            Ticket {STATUS_CFG[selected.status]?.label.toLowerCase()}. Altere o status para responder.
          </div>
        ) : (
          <div className={cn("shrink-0 border-t p-4", darkMode ? "border-white/10 bg-white/3" : "border-slate-200 bg-white")}>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((a, i) => (
                  <div key={i} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs", darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500")}>
                    {isImage(a.name) ? <ImageIcon className="size-3" /> : <FileText className="size-3" />}
                    <span className="max-w-24 truncate">{a.name}</span>
                    <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))}>
                      <X className="size-3 opacity-50 hover:opacity-100" />
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
                className={cn(
                  "shrink-0 size-9 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40",
                  darkMode ? "border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/20" : "border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600"
                )}
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
              </button>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply() } }}
                placeholder="Responder ao usuário... (Enter para enviar)"
                rows={1}
                className={cn(
                  "flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none min-h-[36px] max-h-32",
                  darkMode ? "border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-primary/50" : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-300 focus:border-primary/50"
                )}
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
  const pendingCount = tickets.filter(t => PENDING_STATUSES.includes(t.status)).length
  const closedCount  = tickets.filter(t => CLOSED_STATUSES.includes(t.status)).length

  function TicketCard({ t }: { t: TicketRow }) {
    const s = STATUS_CFG[t.status] ?? STATUS_CFG.aberto
    const Icon = s.icon
    const isOld = daysSince(t.createdAt) > 3
    const geo = t.userIp ? geoData[t.userIp] : null

    return (
      <button
        onClick={() => openTicket(t)}
        className={cn(
          "w-full rounded-xl border transition-all p-4 flex items-start gap-3 text-left",
          isOld
            ? darkMode
              ? "border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10"
              : "border-orange-300 bg-orange-50 hover:bg-orange-100"
            : darkMode
              ? "border-white/8 bg-white/3 hover:border-primary/40 hover:bg-white/5"
              : "border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50"
        )}
      >
        <div className={cn("size-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5", darkMode ? s.badge : s.lightBadge)}>
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isOld && (
              <span className={cn("flex items-center gap-1 text-xs font-semibold", darkMode ? "text-orange-400" : "text-orange-600")}>
                <AlertTriangle className="size-3" />+3 dias
              </span>
            )}
            <span className={cn("text-sm font-semibold truncate", darkMode ? "text-white" : "text-slate-800")}>{t.subject}</span>
            {(() => {
              const pb = getPlanBadge(t.licensePlan)
              return pb ? <span className={cn("text-xs border rounded-full px-2 py-0.5 font-medium shrink-0", pb.cls)}>{pb.label}</span> : null
            })()}
            <span className={cn("text-xs font-medium capitalize shrink-0", darkMode ? PRIORITY_CLS_DARK[t.priority] : PRIORITY_CLS_LIGHT[t.priority])}>{t.priority}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn("text-xs border rounded-full px-2 py-0.5 shrink-0", darkMode ? s.badge : s.lightBadge)}>{s.label}</span>
            <span className={cn("text-xs", darkMode ? "text-white/30" : "text-slate-400")}>{CATEGORY_LABELS[t.category]}</span>
            <span className={cn("text-xs font-medium", darkMode ? "text-white/50" : "text-slate-600")}>{t.userName ?? t.userEmail ?? "—"}</span>
            <span className={cn("text-xs", darkMode ? "text-white/25" : "text-slate-400")}>{fmtDate(t.updatedAt)}</span>
          </div>
          {/* IP + Geo inline */}
          {t.userIp && (
            <div className={cn("flex items-center gap-3 mt-1 text-xs flex-wrap", darkMode ? "text-white/25" : "text-slate-400")}>
              <span className="font-mono">{t.userIp.replace(/^::ffff:/, "")}</span>
              {geo && (
                <>
                  <span className="flex items-center gap-0.5"><MapPin className="size-2.5" />{geo.city}{geo.region ? `, ${geo.region.slice(0,2)}` : ""}</span>
                  {geo.isp && <span className="flex items-center gap-0.5 max-w-32 truncate"><Wifi className="size-2.5 shrink-0" />{geo.isp}</span>}
                </>
              )}
            </div>
          )}
        </div>
        <ChevronLeft className={cn("size-4 shrink-0 rotate-180 mt-1", darkMode ? "text-white/20" : "text-slate-300")} />
      </button>
    )
  }

  return (
    <div className="space-y-5">
      {/* Contadores por status */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.entries(STATUS_CFG).map(([key, cfg]) => {
          const count = tickets.filter(t => t.status === key).length
          const Icon = cfg.icon
          return (
            <button key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "todos" : key)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                statusFilter === key
                  ? "border-primary/50 bg-primary/10"
                  : darkMode ? "border-white/8 bg-white/3 hover:border-white/20" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("size-2 rounded-full", cfg.dot)} />
                <span className={cn("text-xs", darkMode ? "text-white/40" : "text-slate-500")}>{cfg.label}</span>
              </div>
              <p className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-800")}>{count}</p>
            </button>
          )
        })}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 size-4", darkMode ? "text-white/30" : "text-slate-400")} />
        <input
          type="text"
          placeholder="Buscar por assunto, nome ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={cn(
            "w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none",
            darkMode ? "border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-primary/50" : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-300 focus:border-primary/50"
          )}
        />
      </div>

      {/* ── Seção: Tickets pendentes ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className={cn("size-4", darkMode ? "text-orange-400" : "text-orange-500")} />
          <h3 className={cn("text-sm font-semibold", darkMode ? "text-white/80" : "text-slate-700")}>
            Pendentes
          </h3>
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", darkMode ? "bg-orange-500/15 text-orange-400" : "bg-orange-100 text-orange-600")}>
            {pendingCount}
          </span>
          {pendingTickets.some(t => daysSince(t.createdAt) > 3) && (
            <span className={cn("text-xs flex items-center gap-1 font-medium", darkMode ? "text-orange-400" : "text-orange-600")}>
              <AlertTriangle className="size-3" />há tickets com mais de 3 dias!
            </span>
          )}
        </div>
        {pendingTickets.length === 0 ? (
          <div className={cn("rounded-xl border border-dashed flex items-center justify-center py-10 gap-3", darkMode ? "border-white/8" : "border-slate-200")}>
            <CheckCircle2 className={cn("size-5", darkMode ? "text-emerald-400" : "text-emerald-500")} />
            <p className={cn("text-sm", darkMode ? "text-white/30" : "text-slate-400")}>Nenhum ticket pendente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTickets.map(t => <TicketCard key={t.id} t={t} />)}
          </div>
        )}
      </div>

      {/* ── Seção: Resolvidos / Fechados ─────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className={cn("size-4", darkMode ? "text-emerald-400" : "text-emerald-500")} />
          <h3 className={cn("text-sm font-semibold", darkMode ? "text-white/50" : "text-slate-500")}>
            Resolvidos / Fechados
          </h3>
          <span className={cn("text-xs px-2 py-0.5 rounded-full", darkMode ? "bg-white/8 text-white/30" : "bg-slate-100 text-slate-400")}>
            {closedCount}
          </span>
        </div>
        {closedTickets.length === 0 ? (
          <div className={cn("rounded-xl border border-dashed flex items-center justify-center py-8", darkMode ? "border-white/8" : "border-slate-200")}>
            <p className={cn("text-sm", darkMode ? "text-white/25" : "text-slate-400")}>Nenhum ticket resolvido ainda</p>
          </div>
        ) : (
          <div className="space-y-2 opacity-80">
            {closedTickets.map(t => <TicketCard key={t.id} t={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}

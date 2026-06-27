"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Paperclip, X, FileText, Download, Loader2, ZoomIn, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { sendSupportMessage, closeTicketByUser } from "@/lib/actions"
import { cn } from "@/lib/utils"
import type { SupportMessage } from "@/lib/db/schema"

type Attachment = { name: string; url: string }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  aberto:       { label: "Aberto",       color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  em_andamento: { label: "Em andamento", color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  pausado:      { label: "Pausado",      color: "bg-muted text-muted-foreground border-border" },
  resolvido:    { label: "Resolvido",    color: "bg-green-500/15 text-green-600 border-green-500/30" },
  fechado:      { label: "Fechado",      color: "bg-destructive/15 text-destructive border-destructive/30" },
}

const PLAN_SUPPORT: Record<string, { label: string; cls: string } | null> = {
  business:   { label: "Suporte Prioritário", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  enterprise: { label: "Suporte VIP",         cls: "bg-violet-500/15 text-violet-500 border-violet-500/30" },
}

function isImage(name: string) {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)
}

/** Miniatura de imagem com lightbox */
function ImageThumb({ a }: { a: Attachment }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative rounded-lg overflow-hidden border border-border/50 bg-muted/30 hover:border-border transition-colors"
        style={{ width: 80, height: 80 }}
        title={a.name}
      >
        <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn className="size-4 text-white" />
        </div>
      </button>
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl bg-card border-border p-2">
            <img src={a.url} alt={a.name} className="w-full rounded-lg object-contain max-h-[80vh]" />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

/** Chip para arquivos não-imagem */
function FileChip({ a }: { a: Attachment }) {
  return (
    <a
      href={a.url}
      download={a.name}
      className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs hover:bg-muted transition-colors max-w-[200px]"
    >
      <FileText className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate text-foreground">{a.name}</span>
      <Download className="size-3 shrink-0 text-muted-foreground ml-auto" />
    </a>
  )
}

interface TicketChatProps {
  ticketId: string
  initialMessages: SupportMessage[]
  status: string
  userName: string
  licensePlan?: string
}

export function TicketChat({ ticketId, initialMessages, status, userName, licensePlan }: TicketChatProps) {
  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages)
  const [ticketStatus, setTicketStatus] = useState(status)
  const [body, setBody] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [closingConfirm, setClosingConfirm] = useState(false)
  const [closing, setClosing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const lastTs = useRef<string>(
    initialMessages.at(-1)?.createdAt
      ? new Date(initialMessages.at(-1)!.createdAt!).toISOString()
      : new Date(0).toISOString()
  )

  const isClosed = ticketStatus === "fechado" || ticketStatus === "resolvido"

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => { scrollToBottom() }, [messages])

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/messages?ticketId=${ticketId}&after=${encodeURIComponent(lastTs.current)}`)
      if (!res.ok) return
      const news: SupportMessage[] = await res.json()
      if (news.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const deduped = news.filter((m) => !existingIds.has(m.id))
          return deduped.length > 0 ? [...prev, ...deduped] : prev
        })
        lastTs.current = new Date(news.at(-1)!.createdAt!).toISOString()
      }
    } catch {}
  }, [ticketId])

  useEffect(() => {
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [poll])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const MAX_SIZE = 5 * 1024 * 1024
      const results: Attachment[] = []
      for (const file of files) {
        if (file.size > MAX_SIZE) { toast.error(`"${file.name}" excede 5 MB`); continue }
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error("Falha ao ler arquivo"))
          reader.readAsDataURL(file)
        })
        results.push({ name: file.name, url: dataUrl })
      }
      if (results.length > 0) { setAttachments((prev) => [...prev, ...results]); toast.success("Arquivo(s) anexado(s)") }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao anexar")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleSend() {
    if (!body.trim() && attachments.length === 0) return
    setSending(true)
    try {
      await sendSupportMessage(ticketId, body.trim() || "(anexo)", attachments)
      const newMsg: SupportMessage = {
        id: crypto.randomUUID(),
        ticketId,
        authorId: "me",
        authorRole: "user",
        body: body.trim() || "(anexo)",
        attachments: JSON.stringify(attachments),
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, newMsg])
      lastTs.current = new Date(newMsg.createdAt!).toISOString()
      setBody("")
      setAttachments([])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar mensagem")
    } finally {
      setSending(false)
    }
  }

  async function handleClose() {
    setClosing(true)
    try {
      await closeTicketByUser(ticketId)
      setTicketStatus("fechado")
      setClosingConfirm(false)
      toast.success("Ticket fechado com sucesso.")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao fechar ticket")
    } finally {
      setClosing(false)
    }
  }

  const planBadge = licensePlan ? PLAN_SUPPORT[licensePlan.toLowerCase()] : null

  return (
    <div className="flex flex-col h-full">
      {/* Barra de prioridade do plano + botão fechar */}
      {(planBadge || !isClosed) && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            {planBadge && (
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold border rounded-full px-2.5 py-1", planBadge.cls)}>
                {planBadge.label === "Suporte VIP" ? (
                  <span className="size-1.5 rounded-full bg-violet-500 inline-block" />
                ) : (
                  <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
                )}
                {planBadge.label}
              </span>
            )}
            {!planBadge && (
              <span className="text-xs text-muted-foreground">Plano Starter — tempo de resposta padrão</span>
            )}
          </div>
          {!isClosed && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={() => setClosingConfirm(true)}
            >
              <XCircle className="size-3.5" />
              Fechar ticket
            </Button>
          )}
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.authorRole === "user"
          const atts: Attachment[] = (() => {
            try { return JSON.parse(m.attachments ?? "[]") } catch { return [] }
          })()
          const images = atts.filter((a) => isImage(a.name))
          const files  = atts.filter((a) => !isImage(a.name))
          return (
            <div key={m.id} className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
              {/* Avatar */}
              <div className={cn(
                "size-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-5",
                isUser ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"
              )}>
                {isUser ? userName.charAt(0).toUpperCase() : "S"}
              </div>
              <div className={cn("flex flex-col gap-1.5 max-w-[75%]", isUser ? "items-end" : "items-start")}>
                <span className="text-xs text-muted-foreground">
                  {isUser ? "Você" : "Suporte Elevanthe"} •{" "}
                  {new Date(m.createdAt!).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>

                {/* Texto da mensagem */}
                {m.body && m.body !== "(anexo)" && (
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  )}>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                )}

                {/* Galeria de imagens — fora do balão */}
                {images.length > 0 && (
                  <div className={cn("flex flex-wrap gap-1.5", isUser ? "justify-end" : "justify-start")}>
                    {images.map((a, i) => <ImageThumb key={i} a={a} />)}
                  </div>
                )}

                {/* Arquivos — fora do balão */}
                {files.length > 0 && (
                  <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
                    {files.map((a, i) => <FileChip key={i} a={a} />)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input ou aviso de fechado */}
      {isClosed ? (
        <div className="p-4 border-t border-border text-center text-sm text-muted-foreground bg-muted/30 flex items-center justify-center gap-2 shrink-0">
          <CheckCircle2 className="size-4 text-green-500 shrink-0" />
          Ticket {STATUS_MAP[ticketStatus]?.label.toLowerCase()}. Abra um novo ticket se precisar de ajuda.
        </div>
      ) : (
        <div className="border-t border-border p-3 bg-card shrink-0">
          {/* Previews de anexos pendentes */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2.5">
              {attachments.map((a, i) => (
                <div key={i} className="relative group">
                  {isImage(a.name) ? (
                    <div className="size-12 rounded-lg overflow-hidden border border-border bg-muted">
                      <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs border border-border">
                      <FileText className="size-3 shrink-0" />
                      <span className="max-w-24 truncate">{a.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-2.5" />
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
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Digite sua mensagem... (Enter para enviar)"
              className="resize-none min-h-[40px] max-h-32 text-sm bg-input border-border"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={sending || (!body.trim() && attachments.length === 0)}
              className="shrink-0"
              size="icon"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Modal de confirmação: fechar ticket */}
      <Dialog open={closingConfirm} onOpenChange={setClosingConfirm}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Fechar ticket?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao fechar o ticket você confirma que o problema foi resolvido ou que não precisa mais de suporte neste chamado. Isso não pode ser desfeito.
          </p>
          <DialogFooter className="gap-2 flex-row justify-end">
            <Button variant="outline" onClick={() => setClosingConfirm(false)} disabled={closing}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleClose}
              disabled={closing}
            >
              {closing ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
              Sim, fechar ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

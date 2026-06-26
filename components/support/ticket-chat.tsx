"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Paperclip, X, FileText, Image, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { sendSupportMessage } from "@/lib/actions"
import { cn } from "@/lib/utils"
import type { SupportMessage } from "@/lib/db/schema"

type Attachment = { name: string; url: string }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  aberto:       { label: "Aberto",       color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  em_andamento: { label: "Em andamento", color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  pausado:      { label: "Pausado",      color: "bg-muted text-muted-foreground border-border" },
  resolvido:    { label: "Resolvido",    color: "bg-green-500/15 text-green-500 border-green-500/30" },
  fechado:      { label: "Fechado",      color: "bg-destructive/15 text-destructive border-destructive/30" },
}

function isImage(name: string) {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)
}

function AttachmentChip({ a }: { a: Attachment }) {
  if (isImage(a.name)) {
    return (
      <a href={a.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img src={a.url} alt={a.name} className="max-h-40 rounded-lg border border-border object-cover" />
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
      <Download className="size-3.5 shrink-0 text-muted-foreground ml-auto" />
    </a>
  )
}

interface TicketChatProps {
  ticketId: string
  initialMessages: SupportMessage[]
  status: string
  userName: string
}

export function TicketChat({ ticketId, initialMessages, status, userName }: TicketChatProps) {
  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages)
  const [body, setBody] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastTs = useRef<string>(initialMessages.at(-1)?.createdAt?.toString() ?? new Date(0).toISOString())
  const closed = status === "fechado" || status === "resolvido"

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => { scrollToBottom() }, [messages])

  // Polling a cada 5 s para novas mensagens do admin
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/messages?ticketId=${ticketId}&after=${encodeURIComponent(lastTs.current)}`)
      if (!res.ok) return
      const news: SupportMessage[] = await res.json()
      if (news.length > 0) {
        setMessages((prev) => [...prev, ...news])
        lastTs.current = news.at(-1)!.createdAt!.toString()
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
      const results: Attachment[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/support/upload", { method: "POST", body: fd })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        results.push({ name: file.name, url: data.url })
      }
      setAttachments((prev) => [...prev, ...results])
      toast.success(`${results.length} arquivo(s) anexado(s)`)
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar arquivo")
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
      lastTs.current = newMsg.createdAt!.toString()
      setBody("")
      setAttachments([])
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar mensagem")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.authorRole === "user"
          const atts: Attachment[] = (() => {
            try { return JSON.parse(m.attachments ?? "[]") } catch { return [] }
          })()
          return (
            <div key={m.id} className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
              {/* Avatar */}
              <div className={cn(
                "size-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
                isUser ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"
              )}>
                {isUser ? userName.charAt(0).toUpperCase() : "S"}
              </div>
              <div className={cn("flex flex-col max-w-[75%]", isUser ? "items-end" : "items-start")}>
                <span className="text-xs text-muted-foreground mb-1">
                  {isUser ? "Você" : "Suporte Devnix"} •{" "}
                  {new Date(m.createdAt!).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
                )}>
                  {m.body !== "(anexo)" && <p className="whitespace-pre-wrap">{m.body}</p>}
                  {atts.map((a, i) => <AttachmentChip key={i} a={a} />)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {closed ? (
        <div className="p-4 border-t border-border text-center text-sm text-muted-foreground bg-muted/30">
          Este ticket está {STATUS_MAP[status]?.label.toLowerCase()}. Abra um novo ticket se precisar de ajuda.
        </div>
      ) : (
        <div className="border-t border-border p-4 bg-card">
          {/* Anexos pendentes */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                  {isImage(a.name) ? <Image className="size-3" /> : <FileText className="size-3" />}
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
    </div>
  )
}

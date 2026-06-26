"use client"

import { useState } from "react"
import {
  Plus, Search, Clock, CheckCircle2, PauseCircle, AlertCircle, XCircle,
  ChevronRight, Ticket, Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createSupportTicket } from "@/lib/actions"
import { useRouter } from "next/navigation"
import type { SupportTicket } from "@/lib/db/schema"
import { cn } from "@/lib/utils"

const STATUS_CFG: Record<string, { label: string; icon: any; cls: string }> = {
  aberto:       { label: "Aberto",       icon: AlertCircle,   cls: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  em_andamento: { label: "Em andamento", icon: Clock,         cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  pausado:      { label: "Pausado",      icon: PauseCircle,   cls: "bg-muted text-muted-foreground border-border" },
  resolvido:    { label: "Resolvido",    icon: CheckCircle2,  cls: "bg-green-500/15 text-green-600 border-green-500/30" },
  fechado:      { label: "Fechado",      icon: XCircle,       cls: "bg-destructive/15 text-destructive border-destructive/30" },
}

const CATEGORY_LABELS: Record<string, string> = {
  duvida: "Dúvida",
  bug: "Bug / Erro",
  financeiro: "Financeiro",
  conta: "Conta",
  sugestao: "Sugestão",
  outro: "Outro",
}

const PRIORITY_CFG: Record<string, { label: string; cls: string }> = {
  baixa:  { label: "Baixa",  cls: "text-muted-foreground" },
  normal: { label: "Normal", cls: "text-amber-500" },
  alta:   { label: "Alta",   cls: "text-destructive" },
}

interface Props {
  tickets: SupportTicket[]
}

export function SuporteView({ tickets: initial }: Props) {
  const router = useRouter()
  const [tickets] = useState(initial)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [openModal, setOpenModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    subject: "",
    category: "duvida",
    priority: "normal",
    body: "",
  })
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)

  const filtered = tickets.filter((t) => {
    const matchStatus = statusFilter === "todos" || t.status === statusFilter
    const matchSearch =
      !search ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      CATEGORY_LABELS[t.category]?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const results: { name: string; url: string }[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/support/upload", { method: "POST", body: fd })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        results.push({ name: file.name, url: data.url })
      }
      setAttachments((prev) => [...prev, ...results])
      toast.success("Arquivo(s) anexado(s)")
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar arquivo")
    } finally {
      setUploading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error("Preencha o assunto e a descrição")
      return
    }
    setLoading(true)
    try {
      const ticketId = await createSupportTicket({ ...form, attachments })
      toast.success("Ticket criado com sucesso!")
      setOpenModal(false)
      setForm({ subject: "", category: "duvida", priority: "normal", body: "" })
      setAttachments([])
      router.push(`/dashboard/suporte/${ticketId}`)
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao criar ticket")
    } finally {
      setLoading(false)
    }
  }

  const counts = {
    aberto: tickets.filter((t) => t.status === "aberto").length,
    em_andamento: tickets.filter((t) => t.status === "em_andamento").length,
    resolvido: tickets.filter((t) => t.status === "resolvido" || t.status === "fechado").length,
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tickets.length} ticket(s) no total</p>
        </div>
        <Button onClick={() => setOpenModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
          <Plus className="size-4 mr-1.5" />Novo Ticket
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "aberto",       label: "Abertos",     icon: AlertCircle,  cls: "text-blue-500",    bg: "bg-blue-500/10" },
          { key: "em_andamento", label: "Em andamento",icon: Clock,        cls: "text-amber-500",   bg: "bg-amber-500/10" },
          { key: "resolvido",    label: "Resolvidos",  icon: CheckCircle2, cls: "text-green-600",   bg: "bg-green-500/10" },
        ].map(({ key, label, icon: Icon, cls, bg }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "todos" : key)}
            className={cn(
              "rounded-xl border border-border p-3 text-left transition-all hover:border-primary/40",
              statusFilter === key && "border-primary/60 ring-1 ring-primary/30"
            )}
          >
            <div className={cn("size-8 rounded-lg flex items-center justify-center mb-2", bg)}>
              <Icon className={cn("size-4", cls)} />
            </div>
            <p className="text-xl font-bold text-foreground">{counts[key as keyof typeof counts]}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
          </button>
        ))}
      </div>

      {/* Busca e filtro */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: string | null) => { if (v) setStatusFilter(v) }}>
          <SelectTrigger className="w-40 bg-input border-border">
            <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="aberto">Abertos</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="pausado">Pausados</SelectItem>
            <SelectItem value="resolvido">Resolvidos</SelectItem>
            <SelectItem value="fechado">Fechados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de tickets */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <Ticket className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Nenhum ticket encontrado</p>
          <p className="text-xs text-muted-foreground">
            {tickets.length === 0 ? "Clique em \"Novo Ticket\" para abrir seu primeiro chamado." : "Tente ajustar os filtros."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const s = STATUS_CFG[t.status] ?? STATUS_CFG.aberto
            const p = PRIORITY_CFG[t.priority] ?? PRIORITY_CFG.normal
            const Icon = s.icon
            return (
              <button
                key={t.id}
                onClick={() => router.push(`/dashboard/suporte/${t.id}`)}
                className="w-full rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/30 transition-all p-4 flex items-center gap-4 text-left"
              >
                <div className={cn("size-9 rounded-lg border flex items-center justify-center shrink-0", s.cls)}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">{t.subject}</span>
                    <span className={cn("text-xs font-medium", p.cls)}>• {p.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5", s.cls)}>
                      {s.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[t.category]}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </button>
            )
          })}
        </div>
      )}

      {/* Modal: Novo Ticket */}
      <Dialog open={openModal} onOpenChange={(v) => { if (!v) { setOpenModal(false); setAttachments([]) } }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Abrir Novo Ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label>Assunto *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Descreva brevemente o problema..."
                className="bg-input border-border"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v: string | null) => { if (v) setForm({ ...form, category: v }) }}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v: string | null) => { if (v) setForm({ ...form, priority: v }) }}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descrição *</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Descreva detalhadamente o que está acontecendo..."
                className="bg-input border-border resize-none min-h-28"
                required
              />
            </div>
            {/* Anexos */}
            <div className="flex flex-col gap-1.5">
              <Label>Anexos (opcional)</Label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-border hover:border-primary/50 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <input type="file" multiple className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx,.txt,.zip" />
                {uploading ? "Enviando..." : "Clique para anexar imagens ou arquivos (máx. 10 MB cada)"}
              </label>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {attachments.map((a, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                      <span className="max-w-28 truncate">{a.name}</span>
                      <button type="button" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {loading ? "Abrindo..." : "Abrir Ticket"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

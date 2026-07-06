"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createQuote, updateQuote, updateQuoteStatus, deleteQuote, getQuoteWithItems } from "@/lib/actions"
import type { Client, Quote, Service } from "@/lib/db/schema"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Plus, MoreHorizontal, Trash2, Search, FileText, X, ExternalLink, MessageCircle, Mail, Send, Pencil, PenLine, CircleDot, CheckCircle2, XCircle, Clock, Ban } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface QuotesViewProps {
  initialQuotes: Quote[]
  clients: Client[]
  services: Service[]
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground",                               icon: PenLine },
  enviado:  { label: "Enviado",  color: "bg-blue-500/15 text-blue-400 border-blue-500/20",               icon: Clock },
  aprovado: { label: "Aprovado", color: "bg-green-500/15 text-green-400 border-green-500/20",            icon: CheckCircle2 },
  recusado: { label: "Recusado", color: "bg-red-500/15 text-red-400 border-red-500/20",                  icon: XCircle },
  cancelado: { label: "Cancelado", color: "bg-muted text-muted-foreground",                              icon: Ban },
}

interface QuoteItem {
  id: string
  serviceId?: string
  description: string
  quantity: string
  unitPrice: string
  total: string
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

const emptyForm = {
  clientId: "", title: "", validUntil: "", notes: "", internalNotes: "", discount: "0",
  cashPrice: "", cardPrice: "", cardInstallments: "1",
}

export function QuotesView({ initialQuotes, clients, services }: QuotesViewProps) {
  const router = useRouter()
  const [quotes, setQuotes] = useState(initialQuotes)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const prevStatusMapRef = useRef<Record<string, string>>(
    Object.fromEntries(initialQuotes.map(q => [q.id, q.status]))
  )

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  // Sincroniza estado local quando o servidor retorna dados novos (ex: após polling)
  useEffect(() => {
    setQuotes(initialQuotes)
  }, [initialQuotes])

  // Toca som de notificação via Web Audio API
  function playNotificationSound(type: "aprovado" | "recusado") {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const gainNode = ctx.createGain()
      gainNode.connect(ctx.destination)
      gainNode.gain.setValueAtTime(0.45, ctx.currentTime)

      if (type === "aprovado") {
        // Acorde ascendente: C5 → E5 → G5
        const notes = [523.25, 659.25, 783.99]
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.13)
          osc.connect(gainNode)
          osc.start(ctx.currentTime + i * 0.13)
          osc.stop(ctx.currentTime + i * 0.13 + 0.11)
        })
      } else {
        // Bipes descendentes: A4 → F4
        const notes = [440, 349.23]
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18)
          osc.connect(gainNode)
          osc.start(ctx.currentTime + i * 0.18)
          osc.stop(ctx.currentTime + i * 0.18 + 0.13)
        })
      }

      setTimeout(() => ctx.close(), 1200)
    } catch {
      // Web Audio API não suportado — ignora silenciosamente
    }
  }

  // Detecta mudanças de status após polling e dispara toast + som
  useEffect(() => {
    const prev = prevStatusMapRef.current
    const changed: Quote[] = []

    initialQuotes.forEach(q => {
      const oldStatus = prev[q.id]
      if (oldStatus && oldStatus !== q.status &&
          (q.status === "aprovado" || q.status === "recusado")) {
        changed.push(q)
      }
    })

    // Atualiza o mapa de referência
    prevStatusMapRef.current = Object.fromEntries(initialQuotes.map(q => [q.id, q.status]))

    if (changed.length === 0) return

    changed.forEach(q => {
      const clientName = clients.find(c => c.id === q.clientId)?.name ?? "Cliente"
      if (q.status === "aprovado") {
        playNotificationSound("aprovado")
        toast.success(`Orçamento aprovado por ${clientName}`, {
          description: `#${String(q.number).padStart(4, "0")} — ${q.title} · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(q.total))}`,
          duration: 12000,
        })
      } else if (q.status === "recusado") {
        playNotificationSound("recusado")
        toast.error(`Orçamento recusado por ${clientName}`, {
          description: `#${String(q.number).padStart(4, "0")} — ${q.title}`,
          duration: 12000,
        })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuotes])

  // Polling a cada 15s enquanto houver orçamentos enviados aguardando resposta
  useEffect(() => {
    const hasPending = quotes.some(q => q.status === "enviado")
    if (!hasPending) return
    const interval = setInterval(() => router.refresh(), 15000)
    return () => clearInterval(interval)
  }, [quotes, router])

  function getClientPhone(q: Quote): string {
    const phone = clients.find(c => c.id === q.clientId)?.phone ?? ""
    return phone.replace(/\D/g, "")
  }
  function getClientEmail(q: Quote): string {
    return clients.find(c => c.id === q.clientId)?.email ?? ""
  }
  function handleShareWhatsApp(q: Quote) {
    const client = clients.find(c => c.id === q.clientId)
    const url = `${baseUrl}/orcamento/${q.id}`
    const text = `Olá${client ? ` ${client.name}` : ""}! Segue seu orçamento *#${String(q.number).padStart(4, "0")} — ${q.title}*\nTotal: ${formatCurrency(q.total)}\n\nAcesse aqui: ${url}`
    const phone = getClientPhone(q)
    window.open(phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }
  function handleShareEmail(q: Quote) {
    const email = getClientEmail(q)
    const url = `${baseUrl}/orcamento/${q.id}`
    const subject = `Orçamento #${String(q.number).padStart(4, "0")} — ${q.title}`
    const body = `Olá!\n\nSegue seu orçamento.\n\nAcesse aqui: ${url}\n\nQualquer dúvida estou à disposição.`
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }
  function handleShareTelegram(q: Quote) {
    const url = `${baseUrl}/orcamento/${q.id}`
    const text = `Orçamento #${String(q.number).padStart(4, "0")}: ${q.title} — ${formatCurrency(q.total)}`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank")
  }

  const filtered = quotes.filter((q) => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "todos" || q.status === statusFilter
    return matchSearch && matchStatus
  })

  const subtotal = items.reduce((acc, i) => acc + Number(i.total), 0)
  const discount = Number(form.discount) || 0
  const total = subtotal - discount

  const addItem = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "0", total: "0" }])
  }

  const updateItem = (id: string, field: keyof QuoteItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === "quantity" || field === "unitPrice") {
          updated.total = String(Number(updated.quantity) * Number(updated.unitPrice))
        }
        if (field === "serviceId" && value) {
          const svc = services.find((s) => s.id === value)
          if (svc) {
            updated.description = svc.name
            updated.unitPrice = String(svc.price)
            updated.total = String(Number(updated.quantity) * Number(svc.price))
          }
        }
        return updated
      })
    )
  }

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  const handleEdit = async (id: string) => {
    setLoading(true)
    try {
      const data = await getQuoteWithItems(id)
      if (!data) { toast.error("Orçamento não encontrado"); return }
      setEditingId(id)
      setForm({
        clientId: data.clientId,
        title: data.title,
        validUntil: data.validUntil ?? "",
        notes: data.notes ?? "",
        internalNotes: data.internalNotes ?? "",
        discount: String(data.discount ?? "0"),
        cashPrice: data.cashPrice ? String(data.cashPrice) : "",
        cardPrice: data.cardPrice ? String(data.cardPrice) : "",
        cardInstallments: String(data.cardInstallments ?? "1"),
      })
      setItems(
        data.items.map((it) => ({
          id: it.id,
          serviceId: it.serviceId ?? undefined,
          description: it.description,
          quantity: String(it.quantity),
          unitPrice: String(it.unitPrice),
          total: String(it.total),
        })),
      )
      setOpen(true)
    } catch { toast.error("Erro ao carregar orçamento") }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) { toast.error("Adicione pelo menos um item"); return }
    setLoading(true)
    try {
      const payload = {
        ...form,
        subtotal: String(subtotal),
        discount: String(discount),
        total: String(total),
        cashPrice: form.cashPrice || undefined,
        cardPrice: form.cardPrice || undefined,
        cardInstallments: Number(form.cardInstallments) || 1,
        items: items.map(({ id: _id, ...rest }) => rest),
      }
      if (editingId) {
        await updateQuote(editingId, payload)
        toast.success("Orçamento atualizado! O cliente pode responder novamente.")
      } else {
        await createQuote(payload)
        toast.success("Orçamento criado!")
      }
      setOpen(false)
      setForm(emptyForm)
      setItems([])
      setEditingId(null)
      router.refresh()
    } catch { toast.error(editingId ? "Erro ao atualizar orçamento" : "Erro ao criar orçamento") }
    finally { setLoading(false) }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateQuoteStatus(id, status)
      setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status } : q))
      toast.success("Status atualizado!")
    } catch { toast.error("Erro ao atualizar status") }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este orçamento?")) return
    try {
      await deleteQuote(id)
      setQuotes((prev) => prev.filter((q) => q.id !== id))
      toast.success("Orçamento excluído!")
    } catch { toast.error("Erro ao excluir") }
  }

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name ?? clientId

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground text-sm mt-1">{quotes.length} orçamentos</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm(emptyForm); setItems([]); setOpen(true) }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="size-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Buscar orçamentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="todos">Todos</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileText className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Nenhum orçamento encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">#</TableHead>
                  <TableHead className="text-muted-foreground">Título</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="text-muted-foreground">Total</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground hidden lg:table-cell">Data</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((q) => {
                  const sc = statusConfig[q.status] ?? statusConfig.rascunho
                  const StatusIconQ = sc.icon
                  const isRecusado = q.status === "recusado"
                  const isAprovado = q.status === "aprovado"
                  const respondedAt = (q as Quote & { respondedAt?: string | Date | null }).respondedAt
                  const isRecent = respondedAt
                    ? Date.now() - new Date(respondedAt).getTime() < 24 * 60 * 60 * 1000
                    : false
                  const showNewBadge = isRecent && (isAprovado || isRecusado)
                  return (
                    <TableRow key={q.id} className={`border-border hover:bg-muted/20 ${isRecusado ? "bg-red-500/5 border-l-2 border-l-red-500/40" : isAprovado && isRecent ? "bg-green-500/5 border-l-2 border-l-green-500/40" : ""}`}>
                      <TableCell className="text-muted-foreground font-mono text-sm">#{String(q.number).padStart(4, "0")}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span>{q.title}</span>
                          {isRecusado && (q as Quote & { rejectionReason?: string }).rejectionReason && (
                            <span className="text-xs text-red-400 font-normal">
                              Motivo: {(q as Quote & { rejectionReason?: string }).rejectionReason}
                            </span>
                          )}
                          {respondedAt && (
                            <span className="text-[10px] text-muted-foreground">
                              Respondido em {new Date(respondedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{getClientName(q.clientId)}</TableCell>
                      <TableCell className="font-semibold text-foreground">{formatCurrency(q.total)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={`${sc.color} flex items-center gap-1`}>
                            <StatusIconQ className="size-3 shrink-0" />
                            {sc.label}
                          </Badge>
                          {showNewBadge && (
                            <span className="relative flex size-2">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAprovado ? "bg-green-400" : "bg-red-400"}`} />
                              <span className={`relative inline-flex rounded-full size-2 ${isAprovado ? "bg-green-400" : "bg-red-400"}`} />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell text-sm">
                        {format(new Date(q.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Abrir menu</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border w-52">
                            <DropdownMenuItem asChild className="text-foreground cursor-pointer">
                              <a href={`/orcamento/${q.id}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-4 mr-2" />Ver orçamento
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(q.id)} className="text-foreground cursor-pointer">
                              <Pencil className="size-4 mr-2 text-amber-500" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem onClick={() => handleShareWhatsApp(q)} className="text-foreground cursor-pointer">
                              <MessageCircle className="size-4 mr-2 text-green-500" />
                              Enviar por WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareEmail(q)} className="text-foreground cursor-pointer">
                              <Mail className="size-4 mr-2 text-blue-400" />
                              Enviar por E-mail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareTelegram(q)} className="text-foreground cursor-pointer">
                              <Send className="size-4 mr-2 text-sky-400" />
                              Enviar por Telegram
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            {Object.entries(statusConfig).map(([k, v]) => (
                              q.status !== k && (
                                <DropdownMenuItem key={k} onClick={() => handleStatusChange(q.id, k)} className="text-foreground cursor-pointer">
                                  Marcar como {v.label}
                                </DropdownMenuItem>
                              )
                            ))}
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem onClick={() => handleDelete(q.id)} className="text-destructive cursor-pointer focus:text-destructive">
                              <Trash2 className="size-4 mr-2" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New/Edit Quote Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); setItems([]) } }}>
        <DialogContent className="bg-card border-border text-foreground max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            {/* Título */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm">Título *</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Desenvolvimento de site institucional" className="bg-input border-border text-foreground" />
            </div>

            {/* Cliente + Válido até em colunas separadas e bem definidas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Cliente *</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger className="bg-input border-border text-foreground w-full">
                    <SelectValue>
                      <span className={form.clientId ? "text-foreground" : "text-muted-foreground"}>
                        {form.clientId
                          ? clients.find((c) => c.id === form.clientId)?.name ?? "Selecione um cliente..."
                          : "Selecione um cliente..."}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Válido até</Label>
                <Input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  className="bg-input border-border text-foreground w-full"
                />
              </div>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold">Itens do orçamento</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="border-border text-foreground hover:bg-muted gap-1.5">
                  <Plus className="size-3.5" />Adicionar Item
                </Button>
              </div>

              {items.length === 0 && (
                <button
                  type="button"
                  onClick={addItem}
                  className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/20 transition-colors w-full"
                >
                  <Plus className="size-5" />
                  <span className="text-sm">Clique para adicionar o primeiro item</span>
                </button>
              )}

              {items.map((item, idx) => {
                const linkedService = item.serviceId ? services.find(s => s.id === item.serviceId) : null
                return (
                  <div key={item.id} className="border border-border rounded-lg bg-muted/10 overflow-hidden">
                    {/* Cabeçalho do card do item */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {linkedService ? linkedService.name : item.description || "Item"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary">{formatCurrency(item.total)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.id)}
                          title="Excluir item"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Corpo do card do item */}
                    <div className="p-4 flex flex-col gap-3">
                      {/* Linha 1: Serviço */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs">Serviço cadastrado (opcional)</Label>
                        <Select
                          value={item.serviceId ?? "__manual__"}
                          onValueChange={(v) => updateItem(item.id, "serviceId", v === "__manual__" ? "" : v)}
                        >
                          <SelectTrigger className="bg-input border-border text-foreground text-sm">
                            <SelectValue>
                              {item.serviceId
                                ? (services.find(s => s.id === item.serviceId)?.name ?? "Serviço removido")
                                : <span className="text-muted-foreground">Sem vínculo — preencher manualmente</span>
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border max-h-56">
                            <SelectItem value="__manual__">
                              <span className="text-muted-foreground">Sem vínculo (manual)</span>
                            </SelectItem>
                            {services.filter(s => s.active || s.id === item.serviceId).map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                <div className="flex items-center justify-between gap-8 w-full">
                                  <span>{s.name}</span>
                                  <span className="text-muted-foreground text-xs">{formatCurrency(Number(s.price))}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Linha 2: Descrição */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-muted-foreground text-xs">Descrição do item</Label>
                        <Input
                          placeholder="Descreva o serviço ou produto..."
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          className="bg-input border-border text-foreground text-sm"
                        />
                      </div>

                      {/* Linha 3: Qtd + Preço + Total visual */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-muted-foreground text-xs">Quantidade</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                            className="bg-input border-border text-foreground text-sm text-center"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-muted-foreground text-xs">Preço unitário (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                            className="bg-input border-border text-foreground text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-muted-foreground text-xs">Total do item</Label>
                          <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/30 text-sm font-semibold text-primary">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {items.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={addItem} className="self-start text-muted-foreground hover:text-foreground gap-1.5 text-xs">
                  <Plus className="size-3.5" />
                  Adicionar outro item
                </Button>
              )}
            </div>

            {/* Totals + Formas de pagamento no cartao */}
            {items.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-border pt-4">
                {/* Subtotal / desconto / total */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Desconto (R$)</span>
                    <Input type="number" min="0" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="w-28 h-7 bg-input border-border text-foreground text-sm text-right" />
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary text-lg">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Valores de pagamento opcionais */}
                <div className="flex flex-col gap-3">
                  <Label className="text-foreground font-semibold text-sm">Condições de pagamento (opcional)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground text-sm">Valor à vista (R$)</Label>
                      <Input
                        type="number" min="0" step="0.01"
                        value={form.cashPrice}
                        onChange={(e) => setForm({ ...form, cashPrice: e.target.value })}
                        placeholder="Opcional"
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground text-sm">Valor no cartão de crédito (R$)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number" min="0" step="0.01"
                          value={form.cardPrice}
                          onChange={(e) => setForm({ ...form, cardPrice: e.target.value })}
                          placeholder="Opcional"
                          className="bg-input border-border text-foreground flex-1"
                        />
                        <Select value={form.cardInstallments} onValueChange={(v) => setForm({ ...form, cardInstallments: v })}>
                          <SelectTrigger className="w-24 bg-input border-border text-foreground text-sm shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                              <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">Parcelas no cartão de crédito</p>
                    </div>
                  </div>

                  {/* Preview do resumo de pagamento */}
                  {(form.cashPrice || form.cardPrice) && (
                    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/20 px-4 py-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resumo exibido ao cliente</p>
                      {form.cashPrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">A vista / Pix</span>
                          <span className="text-green-400 font-semibold">{formatCurrency(form.cashPrice)}</span>
                        </div>
                      )}
                      {form.cardPrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Cartão de crédito ({form.cardInstallments}x)
                          </span>
                          <span className="text-blue-400 font-semibold">
                            {form.cardInstallments === "1"
                              ? formatCurrency(form.cardPrice)
                              : `${form.cardInstallments}x de ${formatCurrency(Number(form.cardPrice) / Number(form.cardInstallments))}`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Observações (visíveis ao cliente)</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="bg-input border-border text-foreground resize-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Notas internas</Label>
                <Textarea value={form.internalNotes} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} rows={3} className="bg-input border-border text-foreground resize-none" />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border text-foreground hover:bg-muted">Cancelar</Button>
              <Button type="submit" disabled={loading || !form.clientId} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {loading ? "Salvando..." : editingId ? "Salvar e reenviar" : "Criar Orçamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

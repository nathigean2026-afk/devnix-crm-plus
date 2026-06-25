"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createQuote, updateQuoteStatus, deleteQuote } from "@/lib/actions"
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
import { Plus, MoreHorizontal, Trash2, Search, FileText, X, ExternalLink, MessageCircle, Mail, Send } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface QuotesViewProps {
  initialQuotes: Quote[]
  clients: Client[]
  services: Service[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  enviado: { label: "Enviado", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  aprovado: { label: "Aprovado", color: "bg-green-500/15 text-green-400 border-green-500/20" },
  recusado: { label: "Recusado", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  cancelado: { label: "Cancelado", color: "bg-muted text-muted-foreground" },
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
  const prevQuotesRef = useRef(initialQuotes)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  // Sincroniza estado local quando o servidor retorna dados novos (ex: após polling)
  useEffect(() => {
    const prev = prevQuotesRef.current
    const changed = initialQuotes.some((q) => {
      const old = prev.find(p => p.id === q.id)
      return !old || old.status !== q.status
    }) || initialQuotes.length !== prev.length
    if (changed) {
      setQuotes(initialQuotes)
      prevQuotesRef.current = initialQuotes
    }
  }, [initialQuotes])

  // Polling a cada 20s enquanto houver orçamentos pendentes de resposta
  useEffect(() => {
    const hasPending = quotes.some(q => q.status === "enviado" || q.status === "rascunho")
    if (!hasPending) return
    const interval = setInterval(() => {
      router.refresh()
    }, 20000)
    return () => clearInterval(interval)
  }, [quotes, router])

  // Notifica via toast para orçamentos respondidos nas últimas 24h (respeita preferência do usuário)
  useEffect(() => {
    const notifEnabled = localStorage.getItem("devnix_quote_notifications_enabled")
    // Habilitado por padrão (null = nunca configurou = ativo)
    if (notifEnabled === "false") return

    const STORAGE_KEY = "devnix_notified_quotes"
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const alreadyNotified: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")

    const recent = initialQuotes.filter((q) => {
      const respondedAt = (q as Quote & { respondedAt?: string | Date | null }).respondedAt
      if (!respondedAt) return false
      const ts = new Date(respondedAt).getTime()
      return ts > cutoff && !alreadyNotified.includes(q.id)
    })

    if (recent.length === 0) return

    // Pequeno delay para garantir que o Toaster esteja montado após hidratação
    const timer = setTimeout(() => {
      recent.forEach((q) => {
        const clientName = clients.find(c => c.id === q.clientId)?.name ?? "Cliente"
        if (q.status === "aprovado") {
          toast.success(`Orçamento aprovado por ${clientName}`, {
            description: `#${String(q.number).padStart(4, "0")} — ${q.title} · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(q.total))}`,
            duration: 10000,
          })
        } else if (q.status === "recusado") {
          toast.error(`Orçamento recusado por ${clientName}`, {
            description: `#${String(q.number).padStart(4, "0")} — ${q.title}`,
            duration: 10000,
          })
        }
      })

      const newNotified = [...alreadyNotified, ...recent.map(q => q.id)]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotified))
    }, 1200)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) { toast.error("Adicione pelo menos um item"); return }
    setLoading(true)
    try {
      const quoteId = await createQuote({
        ...form,
        subtotal: String(subtotal),
        discount: String(discount),
        total: String(total),
        items: items.map(({ id: _id, ...rest }) => rest),
      })
      toast.success("Orçamento criado!")
      setOpen(false)
      setForm(emptyForm)
      setItems([])
      window.location.reload()
    } catch { toast.error("Erro ao criar orçamento") }
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
        <Button onClick={() => { setForm(emptyForm); setItems([]); setOpen(true) }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus data-icon="inline-start" />Novo Orçamento
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
                          <Badge className={sc.color}>{sc.label}</Badge>
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

      {/* New Quote Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo Orçamento</DialogTitle>
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
                <Select required value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger className="bg-input border-border text-foreground w-full overflow-hidden">
                    <SelectValue placeholder="Selecione um cliente..." />
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
                <Label className="text-foreground font-semibold">Itens</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="border-border text-foreground hover:bg-muted">
                  <Plus data-icon="inline-start" />Adicionar Item
                </Button>
              </div>
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">
                  Clique em &quot;Adicionar Item&quot; para começar
                </p>
              )}
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end border border-border rounded-md p-3 bg-muted/20">
                  <div className="col-span-12 sm:col-span-5 flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Serviço / Descrição</Label>
                    <Select value={item.serviceId ?? "__manual__"} onValueChange={(v) => updateItem(item.id, "serviceId", v === "__manual__" ? "" : v)}>
                      <SelectTrigger className="bg-input border-border text-foreground h-8 text-sm">
                        <SelectValue placeholder="Selecionar serviço..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="__manual__">Manual</SelectItem>
                        {services.filter(s => s.active).map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Descrição"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      className="bg-input border-border text-foreground h-8 text-sm mt-1"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Qtd</Label>
                    <Input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} className="bg-input border-border text-foreground h-8 text-sm" />
                  </div>
                  <div className="col-span-4 sm:col-span-2 flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Preço Unit.</Label>
                    <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)} className="bg-input border-border text-foreground h-8 text-sm" />
                  </div>
                  <div className="col-span-3 sm:col-span-2 flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Total</Label>
                    <p className="h-8 flex items-center text-sm font-semibold text-foreground">{formatCurrency(item.total)}</p>
                  </div>
                  <div className="col-span-1 flex items-end justify-end pb-0.5">
                    <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            {items.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
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
                {loading ? "Criando..." : "Criar Orçamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

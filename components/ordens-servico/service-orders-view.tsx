"use client"

import { useState, useTransition } from "react"
import {
  createServiceOrder,
  updateServiceOrderStatus,
  deleteServiceOrder,
} from "@/lib/actions"
import type { Client, Service, ServiceOrder } from "@/lib/db/schema"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Search,
  ClipboardList,
  X,
  ExternalLink,
  Send,
  MessageCircle,
  Mail,
  Share2,
  Receipt,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ServiceOrderItem {
  id: string
  serviceId?: string
  description: string
  quantity: string
  unitPrice: string
  total: string
}

interface ServiceOrdersViewProps {
  initialOrders: ServiceOrder[]
  clients: Client[]
  services: Service[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  aberto: { label: "Aberto", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  "em-andamento": { label: "Em andamento", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  concluido: { label: "Concluído", color: "bg-green-500/15 text-green-400 border-green-500/20" },
  cancelado: { label: "Cancelado", color: "bg-muted text-muted-foreground" },
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

const emptyForm = {
  clientId: "",
  title: "",
  pixKey: "",
  pixType: "cpf",
  discount: "0",
  discountType: "valor",
  discountExpiry: "",
  cashPrice: "",
  cardPrice: "",
  cardInstallments: "1",
  notes: "",
  internalNotes: "",
}

// Monta texto padrão para compartilhamento
function buildShareText(order: ServiceOrder, clients: Client[], baseUrl: string): string {
  const client = clients.find(c => c.id === order.clientId)
  const url = `${baseUrl}/ordem-servico/${order.id}`
  return `Olá${client ? ` ${client.name}` : ""}! Segue a sua Ordem de Serviço #${String(order.number).padStart(4, "0")}: *${order.title}*\nTotal: ${formatCurrency(order.total)}\n\nAcesse aqui: ${url}`
}

function buildReceiptText(order: ServiceOrder, clients: Client[], baseUrl: string): string {
  const client = clients.find(c => c.id === order.clientId)
  const url = `${baseUrl}/recibo/${order.id}`
  return `Olá${client ? ` ${client.name}` : ""}! Segue o recibo do serviço *${order.title}* — Total: ${formatCurrency(order.total)}\n\nVeja o recibo: ${url}`
}

function getClientEmail(order: ServiceOrder, clients: Client[]): string {
  return clients.find(c => c.id === order.clientId)?.email ?? ""
}

function getClientPhone(order: ServiceOrder, clients: Client[]): string {
  const phone = clients.find(c => c.id === order.clientId)?.phone ?? ""
  return phone.replace(/\D/g, "")
}

export function ServiceOrdersView({ initialOrders, clients, services }: ServiceOrdersViewProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [open, setOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [sendTarget, setSendTarget] = useState<{ order: ServiceOrder; type: "os" | "recibo" } | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState<ServiceOrderItem[]>([])
  const [isPending, startTransition] = useTransition()

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  const filtered = orders.filter((o) => {
    const matchSearch = o.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "todos" || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const subtotal = items.reduce((acc, i) => acc + Number(i.total), 0)
  const discountValue = form.discountType === "percentual"
    ? subtotal * (Number(form.discount) / 100)
    : Number(form.discount) || 0
  const total = Math.max(0, subtotal - discountValue)

  function addItem() {
    setItems(prev => [...prev, { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "0", total: "0" }])
  }

  function updateItem(id: string, field: keyof ServiceOrderItem, value: string) {
    setItems(prev => prev.map((item) => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === "quantity" || field === "unitPrice") {
        updated.total = String(Number(updated.quantity) * Number(updated.unitPrice))
      }
      if (field === "serviceId" && value) {
        const svc = services.find(s => s.id === value)
        if (svc) {
          updated.description = svc.name
          updated.unitPrice = String(svc.price)
          updated.total = String(Number(updated.quantity) * Number(svc.price))
        }
      }
      return updated
    }))
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientId) { toast.error("Selecione um cliente"); return }
    if (items.length === 0) { toast.error("Adicione pelo menos um item"); return }

    startTransition(async () => {
      try {
        await createServiceOrder({
          ...form,
          cardInstallments: Number(form.cardInstallments),
          subtotal: String(subtotal),
          discount: String(discountValue),
          total: String(total),
          cashPrice: form.cashPrice || undefined,
          cardPrice: form.cardPrice || undefined,
          items: items.map(({ id: _id, ...rest }) => rest),
        })
        toast.success("Ordem de serviço criada!")
        setOpen(false)
        setForm(emptyForm)
        setItems([])
        window.location.reload()
      } catch {
        toast.error("Erro ao criar ordem de serviço")
      }
    })
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateServiceOrderStatus(id, status)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
      if (status === "concluido") {
        toast.success("OS concluída! Receita lançada automaticamente no financeiro.")
      } else {
        toast.success("Status atualizado!")
      }
    } catch {
      toast.error("Erro ao atualizar status")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir esta ordem de serviço?")) return
    try {
      await deleteServiceOrder(id)
      setOrders(prev => prev.filter(o => o.id !== id))
      toast.success("Ordem excluída!")
    } catch {
      toast.error("Erro ao excluir")
    }
  }

  function getClientName(clientId: string) {
    return clients.find(c => c.id === clientId)?.name ?? clientId
  }

  function openSendDialog(order: ServiceOrder, type: "os" | "recibo") {
    setSendTarget({ order, type })
    setSendOpen(true)
  }

  function handleShareWhatsApp(order: ServiceOrder, type: "os" | "recibo") {
    const text = type === "os"
      ? buildShareText(order, clients, baseUrl)
      : buildReceiptText(order, clients, baseUrl)
    const phone = getClientPhone(order, clients)
    const url = phone
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, "_blank")
  }

  function handleShareEmail(order: ServiceOrder, type: "os" | "recibo") {
    const email = getClientEmail(order, clients)
    const link = type === "os"
      ? `${baseUrl}/ordem-servico/${order.id}`
      : `${baseUrl}/recibo/${order.id}`
    const subject = type === "os"
      ? `Ordem de Serviço #${String(order.number).padStart(4, "0")} — ${order.title}`
      : `Recibo — ${order.title}`
    const body = type === "os"
      ? `Olá!\n\nSegue a sua Ordem de Serviço.\n\nAcesse aqui: ${link}\n\nQualquer dúvida estou à disposição.`
      : `Olá!\n\nSegue o recibo do serviço.\n\nAcesse aqui: ${link}\n\nObrigado pela preferência!`
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  function handleShareTelegram(order: ServiceOrder, type: "os" | "recibo") {
    const link = type === "os"
      ? `${baseUrl}/ordem-servico/${order.id}`
      : `${baseUrl}/recibo/${order.id}`
    const text = type === "os"
      ? `OS #${String(order.number).padStart(4, "0")}: ${order.title} — ${formatCurrency(order.total)}`
      : `Recibo: ${order.title} — ${formatCurrency(order.total)}`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, "_blank")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ordens de Serviço</h1>
          <p className="text-muted-foreground text-sm mt-1">{orders.length} ordens</p>
        </div>
        <Button
          onClick={() => { setForm(emptyForm); setItems([]); setOpen(true) }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="size-4 mr-2" />
          Nova Ordem
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ordens..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="todos">Todos os status</SelectItem>
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
              <ClipboardList className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Nenhuma ordem de serviço encontrada</p>
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
                {filtered.map((o) => {
                  const sc = statusConfig[o.status] ?? statusConfig.aberto
                  return (
                    <TableRow key={o.id} className="border-border hover:bg-muted/20">
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        #{String(o.number).padStart(4, "0")}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{o.title}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {getClientName(o.clientId)}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {formatCurrency(o.total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={sc.color}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell text-sm">
                        {format(new Date(o.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Abrir menu</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border w-52">
                            <DropdownMenuItem asChild className="text-foreground cursor-pointer">
                              <a href={`/ordem-servico/${o.id}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-4 mr-2" />
                                Ver / Imprimir OS
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="text-foreground cursor-pointer">
                              <a href={`/recibo/${o.id}`} target="_blank" rel="noopener noreferrer">
                                <Receipt className="size-4 mr-2" />
                                Ver Recibo
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            {/* Envio da OS */}
                            <DropdownMenuItem
                              onClick={() => handleShareWhatsApp(o, "os")}
                              className="text-foreground cursor-pointer"
                            >
                              <MessageCircle className="size-4 mr-2 text-green-500" />
                              Enviar OS por WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleShareEmail(o, "os")}
                              className="text-foreground cursor-pointer"
                            >
                              <Mail className="size-4 mr-2 text-blue-400" />
                              Enviar OS por E-mail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleShareTelegram(o, "os")}
                              className="text-foreground cursor-pointer"
                            >
                              <Send className="size-4 mr-2 text-sky-400" />
                              Enviar OS por Telegram
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            {/* Envio do Recibo */}
                            <DropdownMenuItem
                              onClick={() => handleShareWhatsApp(o, "recibo")}
                              className="text-foreground cursor-pointer"
                            >
                              <MessageCircle className="size-4 mr-2 text-green-500" />
                              Enviar Recibo por WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleShareEmail(o, "recibo")}
                              className="text-foreground cursor-pointer"
                            >
                              <Mail className="size-4 mr-2 text-blue-400" />
                              Enviar Recibo por E-mail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleShareTelegram(o, "recibo")}
                              className="text-foreground cursor-pointer"
                            >
                              <Send className="size-4 mr-2 text-sky-400" />
                              Enviar Recibo por Telegram
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            {Object.entries(statusConfig).map(([k, v]) => (
                              o.status !== k && (
                                <DropdownMenuItem
                                  key={k}
                                  onClick={() => handleStatusChange(o.id, k)}
                                  className="text-foreground cursor-pointer"
                                >
                                  Marcar como {v.label}
                                </DropdownMenuItem>
                              )
                            ))}
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              onClick={() => handleDelete(o.id)}
                              className="text-destructive cursor-pointer focus:text-destructive"
                            >
                              <Trash2 className="size-4 mr-2" />
                              Excluir
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

      {/* Dialog Nova OS */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Nova Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            {/* Dados principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-foreground text-sm font-medium">Título *</Label>
                <Input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Desenvolvimento de site"
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-foreground text-sm font-medium">Cliente *</Label>
                <Select value={form.clientId} onValueChange={v => setForm({ ...form, clientId: v })}>
                  <SelectTrigger className="bg-input border-border text-foreground w-full">
                    <SelectValue placeholder="Selecione um cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-60">
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-foreground text-sm font-medium">Chave Pix (para esta OS)</Label>
                <Input
                  value={form.pixKey}
                  onChange={e => setForm({ ...form, pixKey: e.target.value })}
                  placeholder="Deixe em branco para usar a chave padrão das Configurações"
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>

            {/* Itens */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold">Itens</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="border-border text-foreground hover:bg-muted">
                  <Plus className="size-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg bg-muted/10">
                  Clique em &quot;Adicionar Item&quot; para começar
                </div>
              )}
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end border border-border rounded-lg p-3 bg-muted/20">
                  <div className="col-span-12 sm:col-span-5 flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Serviço / Descrição</Label>
                    <Select
                      value={item.serviceId ?? "__manual__"}
                      onValueChange={v => updateItem(item.id, "serviceId", v === "__manual__" ? "" : v)}
                    >
                      <SelectTrigger className="bg-input border-border text-foreground h-8 text-sm">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="__manual__">Manual</SelectItem>
                        {services.filter(s => s.active).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Descrição do serviço"
                      value={item.description}
                      onChange={e => updateItem(item.id, "description", e.target.value)}
                      className="bg-input border-border text-foreground h-8 text-sm mt-1"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Qtd</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, "quantity", e.target.value)}
                      className="bg-input border-border text-foreground h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Preço Unit.</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={item.unitPrice}
                      onChange={e => updateItem(item.id, "unitPrice", e.target.value)}
                      className="bg-input border-border text-foreground h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Total</Label>
                    <p className="h-8 flex items-center text-sm font-semibold text-foreground">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                  <div className="col-span-1 flex items-end justify-end">
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Descontos e formas de pagamento */}
            {items.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-border pt-4">
                <Label className="text-foreground font-semibold">Valores e Descontos</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground text-sm">Tipo de desconto</Label>
                    <Select value={form.discountType} onValueChange={v => setForm({ ...form, discountType: v })}>
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="valor">Valor fixo (R$)</SelectItem>
                        <SelectItem value="percentual">Percentual (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground text-sm">
                      {form.discountType === "percentual" ? "Desconto (%)" : "Desconto (R$)"}
                    </Label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={form.discount}
                      onChange={e => setForm({ ...form, discount: e.target.value })}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground text-sm">Desconto válido até</Label>
                    <Input
                      type="date"
                      value={form.discountExpiry}
                      onChange={e => setForm({ ...form, discountExpiry: e.target.value })}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground text-sm">Valor à vista (R$)</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={form.cashPrice}
                      onChange={e => setForm({ ...form, cashPrice: e.target.value })}
                      placeholder="Opcional"
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground text-sm">Valor no cartão (R$)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number" min="0" step="0.01"
                        value={form.cardPrice}
                        onChange={e => setForm({ ...form, cardPrice: e.target.value })}
                        placeholder="Opcional"
                        className="bg-input border-border text-foreground flex-1"
                      />
                      <Select value={form.cardInstallments} onValueChange={v => setForm({ ...form, cardInstallments: v })}>
                        <SelectTrigger className="w-24 bg-input border-border text-foreground text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                            <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border border-border rounded-lg p-4 bg-muted/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Desconto</span>
                      <span className="text-red-400">- {formatCurrency(discountValue)}</span>
                    </div>
                  )}
                  <Separator className="bg-border" />
                  <div className="flex justify-between font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary text-lg">{formatCurrency(total)}</span>
                  </div>
                  {form.cashPrice && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">À vista</span>
                      <span className="text-green-400 font-semibold">{formatCurrency(form.cashPrice)}</span>
                    </div>
                  )}
                  {form.cardPrice && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cartão ({form.cardInstallments}x)</span>
                      <span className="text-blue-400 font-semibold">
                        {form.cardInstallments === "1"
                          ? formatCurrency(form.cardPrice)
                          : `${form.cardInstallments}x de ${formatCurrency(Number(form.cardPrice) / Number(form.cardInstallments))}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Observações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm font-medium">Observações (visíveis ao cliente)</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="bg-input border-border text-foreground resize-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm font-medium">Notas internas</Label>
                <Textarea
                  value={form.internalNotes}
                  onChange={e => setForm({ ...form, internalNotes: e.target.value })}
                  rows={3}
                  className="bg-input border-border text-foreground resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-border text-foreground hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || !form.clientId}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isPending ? "Criando..." : "Criar Ordem de Serviço"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

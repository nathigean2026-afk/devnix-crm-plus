"use client"

import { useState } from "react"
import { createClient, updateClient, deleteClient, getClientHistory } from "@/lib/actions"
import type { Client, Quote, ServiceOrder, Transaction } from "@/lib/db/schema"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Plus, MoreHorizontal, Pencil, Trash2, Search, Users,
  Phone, Mail, Building2, MapPin, History, ClipboardList,
  FileText, DollarSign, TrendingUp, TrendingDown, Loader2
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClientsTableProps {
  initialClients: Client[]
}

const emptyForm = {
  name: "", email: "", phone: "", company: "", document: "",
  address: "", city: "", state: "", notes: "",
}

function formatCurrency(v: string | number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0))
}

const statusColorOS: Record<string, string> = {
  aberto: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  andamento: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  concluido: "bg-green-500/15 text-green-400 border-green-500/20",
  cancelado: "bg-red-500/15 text-red-400 border-red-500/20",
}
const statusLabelOS: Record<string, string> = {
  aberto: "Aberto", andamento: "Em Andamento", concluido: "Concluído", cancelado: "Cancelado"
}

type ClientHistory = {
  orders: ServiceOrder[]
  quotes: Quote[]
  transactions: Transaction[]
}

function ClientHistoryPanel({ clientId }: { clientId: string }) {
  const [history, setHistory] = useState<ClientHistory | null>(null)
  const [loading, setLoading] = useState(false)

  if (!history && !loading) {
    setLoading(true)
    getClientHistory(clientId).then((data) => {
      setHistory(data)
      setLoading(false)
    })
  }

  if (loading || !history) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalReceita = history.transactions
    .filter(t => t.type === "receita" && t.status === "pago")
    .reduce((s, t) => s + Number(t.amount), 0)
  const totalPendente = history.transactions
    .filter(t => t.type === "receita" && t.status === "pendente")
    .reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/30 border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">OS</p>
          <p className="text-xl font-bold text-foreground">{history.orders.length}</p>
        </div>
        <div className="rounded-lg bg-muted/30 border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Orçamentos</p>
          <p className="text-xl font-bold text-foreground">{history.quotes.length}</p>
        </div>
        <div className="rounded-lg bg-muted/30 border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Recebido</p>
          <p className="text-sm font-bold text-green-400">{formatCurrency(totalReceita)}</p>
        </div>
      </div>

      {totalPendente > 0 && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-sm text-yellow-400">
          A receber: <span className="font-bold">{formatCurrency(totalPendente)}</span>
        </div>
      )}

      {/* Ordens de Serviço */}
      {history.orders.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <ClipboardList className="size-4 text-muted-foreground" /> Ordens de Serviço
          </p>
          <div className="flex flex-col gap-2">
            {history.orders.map(o => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/10 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    #{String(o.number).padStart(4, "0")} — {o.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(o.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(o.total)}</span>
                  <Badge className={`text-xs ${statusColorOS[o.status] ?? ""}`}>
                    {statusLabelOS[o.status] ?? o.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orçamentos */}
      {history.quotes.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" /> Orçamentos
          </p>
          <div className="flex flex-col gap-2">
            {history.quotes.map(q => (
              <div key={q.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/10 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    #{String(q.number).padStart(4, "0")} — {q.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(q.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground shrink-0 ml-2">
                  {formatCurrency(q.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.orders.length === 0 && history.quotes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
          <History className="size-8 opacity-40" />
          <p className="text-sm">Nenhum histórico encontrado</p>
        </div>
      )}
    </div>
  )
}

export function ClientsTable({ initialClients }: ClientsTableProps) {
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [open, setOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "todos" || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const openNew = () => {
    setEditClient(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditClient(client)
    setForm({
      name: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      company: client.company ?? "",
      document: client.document ?? "",
      address: client.address ?? "",
      city: client.city ?? "",
      state: client.state ?? "",
      notes: client.notes ?? "",
    })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editClient) {
        await updateClient(editClient.id, form)
        setClients((prev) =>
          prev.map((c) => c.id === editClient.id ? { ...c, ...form, updatedAt: new Date() } : c)
        )
        toast.success("Cliente atualizado!")
      } else {
        await createClient(form)
        toast.success("Cliente criado!")
        window.location.reload()
      }
      setOpen(false)
    } catch {
      toast.error("Erro ao salvar cliente")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este cliente?")) return
    try {
      await deleteClient(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
      toast.success("Cliente excluído!")
    } catch {
      toast.error("Erro ao excluir cliente")
    }
  }

  const handleToggleStatus = async (client: Client) => {
    const newStatus = client.status === "ativo" ? "inativo" : "ativo"
    try {
      await updateClient(client.id, { status: newStatus })
      setClients((prev) =>
        prev.map((c) => c.id === client.id ? { ...c, status: newStatus } : c)
      )
      toast.success(`Cliente ${newStatus === "ativo" ? "ativado" : "inativado"}`)
    } catch {
      toast.error("Erro ao atualizar status")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} clientes cadastrados</p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
          <Plus className="size-4 mr-1.5" />
          <span className="hidden sm:inline">Novo </span>Cliente
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36 bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Nenhum cliente encontrado</p>
              <Button variant="outline" size="sm" onClick={openNew} className="border-border text-foreground hover:bg-muted">
                Cadastrar cliente
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="flex flex-col divide-y divide-border sm:hidden">
                {filtered.map((client) => (
                  <div key={client.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {client.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{client.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {client.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{client.phone}</span>}
                        {client.email && !client.phone && <span className="flex items-center gap-1 truncate"><Mail className="size-3 shrink-0" />{client.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={client.status === "ativo" ? "default" : "secondary"}
                        className={client.status === "ativo"
                          ? "bg-green-500/15 text-green-400 border-green-500/20 text-xs"
                          : "bg-muted text-muted-foreground text-xs"
                        }
                      >
                        {client.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => openEdit(client)} className="text-foreground cursor-pointer">
                            <History className="size-4 mr-2" />Ver Histórico / Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(client)} className="text-foreground cursor-pointer">
                            {client.status === "ativo" ? "Inativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(client.id)} className="text-destructive cursor-pointer focus:text-destructive">
                            <Trash2 className="size-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: tabela */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Nome</TableHead>
                      <TableHead className="text-muted-foreground hidden md:table-cell">Empresa</TableHead>
                      <TableHead className="text-muted-foreground">Contato</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground hidden lg:table-cell">Cadastrado</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((client) => (
                      <TableRow key={client.id} className="border-border hover:bg-muted/20">
                        <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell">{client.company ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.phone ?? client.email ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={client.status === "ativo" ? "default" : "secondary"}
                            className={client.status === "ativo"
                              ? "bg-green-500/15 text-green-400 border-green-500/20"
                              : "bg-muted text-muted-foreground"
                            }
                          >
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden lg:table-cell text-sm">
                          {format(new Date(client.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Menu</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem onClick={() => openEdit(client)} className="text-foreground cursor-pointer">
                                <History className="size-4 mr-2" />Histórico / Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(client)} className="text-foreground cursor-pointer">
                                {client.status === "ativo" ? "Inativar" : "Ativar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(client.id)} className="text-destructive cursor-pointer focus:text-destructive">
                                <Trash2 className="size-4 mr-2" />Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog editar / criar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editClient ? editClient.name : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>

          {editClient ? (
            <Tabs defaultValue="dados" className="mt-1">
              <TabsList className="w-full grid grid-cols-2 bg-muted/30">
                <TabsTrigger value="dados">
                  <Pencil className="size-3.5 mr-1.5" />Dados
                </TabsTrigger>
                <TabsTrigger value="historico">
                  <History className="size-3.5 mr-1.5" />Histórico
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="mt-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label className="text-foreground text-sm">Nome *</Label>
                      <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-input border-border text-foreground" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground text-sm">E-mail</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-input border-border text-foreground" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground text-sm">Telefone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-input border-border text-foreground" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground text-sm">Empresa</Label>
                      <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-input border-border text-foreground" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground text-sm">CPF / CNPJ</Label>
                      <Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} className="bg-input border-border text-foreground" />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label className="text-foreground text-sm">Endereço</Label>
                      <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-input border-border text-foreground" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground text-sm">Cidade</Label>
                      <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-input border-border text-foreground" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground text-sm">Estado</Label>
                      <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="SP" className="bg-input border-border text-foreground" />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label className="text-foreground text-sm">Observações</Label>
                      <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="bg-input border-border text-foreground resize-none" />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border text-foreground hover:bg-muted">Cancelar</Button>
                    <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      {loading ? "Salvando..." : "Atualizar"}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>

              <TabsContent value="historico" className="mt-4">
                <ClientHistoryPanel clientId={editClient.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-foreground text-sm">Nome *</Label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-input border-border text-foreground" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-sm">E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-input border-border text-foreground" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-sm">Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-input border-border text-foreground" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-sm">Empresa</Label>
                  <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-input border-border text-foreground" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-sm">CPF / CNPJ</Label>
                  <Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} className="bg-input border-border text-foreground" />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-foreground text-sm">Endereço</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-input border-border text-foreground" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-sm">Cidade</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-input border-border text-foreground" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground text-sm">Estado</Label>
                  <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="SP" className="bg-input border-border text-foreground" />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-foreground text-sm">Observações</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="bg-input border-border text-foreground resize-none" />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border text-foreground hover:bg-muted">Cancelar</Button>
                <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {loading ? "Criando..." : "Criar Cliente"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

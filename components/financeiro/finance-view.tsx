"use client"

import { useState } from "react"
import { createTransaction, updateTransaction, deleteTransaction } from "@/lib/actions"
import type { Client, Transaction, ServiceOrder } from "@/lib/db/schema"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, MoreHorizontal, Trash2, Search, DollarSign, TrendingUp, TrendingDown, CheckCircle, Info, Clock, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface FinanceViewProps {
  initialTransactions: Transaction[]
  clients: Client[]
  pendingOrders: ServiceOrder[]
}

const statusColors: Record<string, string> = {
  pendente: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  pago: "bg-green-500/15 text-green-400 border-green-500/20",
  cancelado: "bg-muted text-muted-foreground",
}

const categories = ["Serviço", "Produto", "Consultoria", "Mensalidade", "Imposto", "Aluguel", "Salário", "Outro"]

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

const emptyForm = {
  type: "receita", description: "", amount: "", category: "", clientId: "", dueDate: "", status: "pendente",
}

export function FinanceView({ initialTransactions, clients, pendingOrders }: FinanceViewProps) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("todos")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [pendingOsModalOpen, setPendingOsModalOpen] = useState(false)

  const filtered = transactions.filter((t) => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) || (t.category ?? "").toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === "todos" || t.type === tab
    return matchSearch && matchTab
  })

  const totalReceita = transactions.filter(t => t.type === "receita" && t.status === "pago").reduce((a, t) => a + Number(t.amount), 0)
  const totalDespesa = transactions.filter(t => t.type === "despesa" && t.status === "pago").reduce((a, t) => a + Number(t.amount), 0)
  const totalPendente = transactions.filter(t => t.status === "pendente").reduce((a, t) => a + (t.type === "receita" ? Number(t.amount) : -Number(t.amount)), 0)
  const totalAReceber = pendingOrders.reduce((a, o) => a + Number(o.total), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createTransaction({ ...form, clientId: form.clientId || undefined })
      toast.success("Lançamento criado!")
      setOpen(false)
      setForm(emptyForm)
      window.location.reload()
    } catch { toast.error("Erro ao criar lançamento") }
    finally { setLoading(false) }
  }

  const handleMarkPaid = async (t: Transaction) => {
    try {
      const paidAt = format(new Date(), "yyyy-MM-dd")
      await updateTransaction(t.id, { status: "pago", paidAt })
      setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, status: "pago", paidAt } : tr))
      toast.success("Marcado como pago!")
    } catch { toast.error("Erro ao atualizar") }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este lançamento?")) return
    try {
      await deleteTransaction(id)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      toast.success("Lançamento excluído!")
    } catch { toast.error("Erro ao excluir") }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">{transactions.length} lançamentos</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true) }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus data-icon="inline-start" />Novo Lançamento
        </Button>
      </div>

      {/* Aviso de auto-lançamento */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-sm text-blue-300">
        <Info className="size-4 mt-0.5 shrink-0" />
        <p>
          <span className="font-semibold">Receitas automáticas:</span> quando uma Ordem de Serviço é marcada como{" "}
          <span className="font-semibold">Concluída</span>, a receita é lançada aqui automaticamente. Cadastre apenas as despesas manualmente.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg p-2.5 bg-green-500/10 shrink-0">
              <TrendingUp className="size-5 text-green-400" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Receita Realizada</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(totalReceita)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg p-2.5 bg-red-500/10 shrink-0">
              <TrendingDown className="size-5 text-red-400" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Despesas Pagas</p>
              <p className="text-xl font-bold text-red-400">{formatCurrency(totalDespesa)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg p-2.5 bg-blue-500/10 shrink-0">
              <DollarSign className="size-5 text-blue-400" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo Líquido</p>
              <p className={`text-xl font-bold ${totalReceita - totalDespesa >= 0 ? "text-green-400" : "text-red-400"}`}>
                {formatCurrency(totalReceita - totalDespesa)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card A Receber — clicável */}
        <Card
          className="bg-card border-border cursor-pointer hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors"
          onClick={() => setPendingOsModalOpen(true)}
        >
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-lg p-2.5 bg-amber-500/10 shrink-0">
              <Clock className="size-5 text-amber-400" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">A Receber</p>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(totalAReceber)}</p>
              <p className="text-xs text-muted-foreground">{pendingOrders.length} OS pendente{pendingOrders.length !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal OS pendentes de recebimento */}
      <Dialog open={pendingOsModalOpen} onOpenChange={setPendingOsModalOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-none sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Clock className="size-4 text-amber-400" />
              OS Pendentes de Recebimento
            </DialogTitle>
          </DialogHeader>
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <CheckCircle className="size-10 text-green-400/40" />
              <p className="text-muted-foreground text-sm">Nenhuma OS pendente de recebimento</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {pendingOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-foreground text-sm truncate">
                      #{String(o.number).padStart(4, "0")} — {o.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {o.completedAt ? format(new Date(o.completedAt), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-amber-400 tabular-nums">{formatCurrency(o.total)}</span>
                    <a
                      href="/dashboard/ordens-servico"
                      className="inline-flex items-center justify-center size-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Ver OS"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-1 pt-2 border-t border-border mt-1">
                <span className="text-sm text-muted-foreground font-medium">Total a receber</span>
                <span className="font-bold text-amber-400">{formatCurrency(totalAReceber)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Buscar lançamentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground" />
            </div>
          </div>
          <Tabs value={tab} onValueChange={setTab} className="mt-3">
            <TabsList className="bg-muted border border-border">
              <TabsTrigger value="todos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Todos</TabsTrigger>
              <TabsTrigger value="receita" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Receitas</TabsTrigger>
              <TabsTrigger value="despesa" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Despesas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <DollarSign className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Nenhum lançamento encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Descrição</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="text-muted-foreground hidden sm:table-cell">Vencimento</TableHead>
                  <TableHead className="text-muted-foreground">Valor</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="border-border hover:bg-muted/20">
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">{t.description}</span>
                        <span className={`text-xs font-medium ${t.type === "receita" ? "text-green-400" : "text-red-400"}`}>
                          {t.type === "receita" ? "Receita" : "Despesa"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{t.category ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell text-sm">
                      {t.dueDate ? format(new Date(t.dueDate), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                    </TableCell>
                    <TableCell className={`font-semibold ${t.type === "receita" ? "text-green-400" : "text-red-400"}`}>
                      {t.type === "receita" ? "+" : "-"}{formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[t.status] ?? statusColors.pendente}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Abrir menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          {t.status === "pendente" && (
                            <DropdownMenuItem onClick={() => handleMarkPaid(t)} className="text-foreground cursor-pointer">
                              <CheckCircle className="size-4" />Marcar como pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-destructive cursor-pointer focus:text-destructive">
                            <Trash2 className="size-4" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo Lançamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm">Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm">Descrição *</Label>
              <Input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-input border-border text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Valor (R$) *</Label>
                <Input required type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-input border-border text-foreground" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Vencimento</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="bg-input border-border text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm">Categoria</Label>
              <Select value={form.category || ""} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm">Cliente (opcional)</Label>
              <Select value={form.clientId || ""} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Nenhum cliente" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border text-foreground hover:bg-muted">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {loading ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

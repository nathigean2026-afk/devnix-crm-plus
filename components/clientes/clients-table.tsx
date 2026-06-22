"use client"

import { useState } from "react"
import { createClient, updateClient, deleteClient } from "@/lib/actions"
import type { Client } from "@/lib/db/schema"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Users } from "lucide-react"
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
        // Refresh from server via router
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} clientes cadastrados</p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus data-icon="inline-start" />
          Novo Cliente
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
              <SelectTrigger className="w-40 bg-input border-border text-foreground">
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
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Empresa</TableHead>
                  <TableHead className="text-muted-foreground hidden sm:table-cell">Contato</TableHead>
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
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
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
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => openEdit(client)} className="text-foreground cursor-pointer">
                            <Pencil className="size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(client)} className="text-foreground cursor-pointer">
                            {client.status === "ativo" ? "Inativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(client.id)}
                            className="text-destructive cursor-pointer focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            Excluir
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

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-foreground text-sm">Nome *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Empresa</Label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">CPF / CNPJ</Label>
                <Input
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: e.target.value })}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-foreground text-sm">Endereço</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Cidade</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Estado</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="SP"
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-foreground text-sm">Observações</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? "Salvando..." : editClient ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState } from "react"
import { createService, updateService, deleteService } from "@/lib/actions"
import type { Service } from "@/lib/db/schema"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Wrench } from "lucide-react"

interface ServicesTableProps {
  initialServices: Service[]
}

const emptyForm = { name: "", description: "", price: "", unit: "un", category: "" }

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

export function ServicesTable({ initialServices }: ServicesTableProps) {
  const [services, setServices] = useState(initialServices)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => { setEditService(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (s: Service) => {
    setEditService(s)
    setForm({ name: s.name, description: s.description ?? "", price: String(s.price), unit: s.unit, category: s.category ?? "" })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editService) {
        await updateService(editService.id, form)
        setServices((prev) => prev.map((s) => s.id === editService.id ? { ...s, ...form, updatedAt: new Date() } : s))
        toast.success("Serviço atualizado!")
      } else {
        await createService(form)
        toast.success("Serviço criado!")
        window.location.reload()
      }
      setOpen(false)
    } catch { toast.error("Erro ao salvar serviço") }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este serviço?")) return
    try {
      await deleteService(id)
      setServices((prev) => prev.filter((s) => s.id !== id))
      toast.success("Serviço excluído!")
    } catch { toast.error("Erro ao excluir serviço") }
  }

  const handleToggleActive = async (s: Service) => {
    try {
      await updateService(s.id, { active: !s.active })
      setServices((prev) => prev.map((sv) => sv.id === s.id ? { ...sv, active: !sv.active } : sv))
    } catch { toast.error("Erro ao atualizar") }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground text-sm mt-1">{services.length} serviços cadastrados</p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus data-icon="inline-start" />
          Novo Serviço
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar serviços..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Wrench className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Nenhum serviço encontrado</p>
              <Button variant="outline" size="sm" onClick={openNew} className="border-border text-foreground hover:bg-muted">
                Cadastrar serviço
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="text-muted-foreground">Preço</TableHead>
                  <TableHead className="text-muted-foreground hidden sm:table-cell">Unidade</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="border-border hover:bg-muted/20">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{s.name}</p>
                        {s.description && <p className="text-xs text-muted-foreground truncate max-w-48">{s.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{s.category ?? "—"}</TableCell>
                    <TableCell className="font-semibold text-foreground">{formatCurrency(s.price)}</TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">{s.unit}</TableCell>
                    <TableCell>
                      <Badge
                        variant={s.active ? "default" : "secondary"}
                        className={s.active ? "bg-green-500/15 text-green-400 border-green-500/20" : "bg-muted text-muted-foreground"}
                      >
                        {s.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => openEdit(s)} className="text-foreground cursor-pointer">
                            <Pencil className="size-4" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(s)} className="text-foreground cursor-pointer">
                            {s.active ? "Inativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-destructive cursor-pointer focus:text-destructive">
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
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm">Nome *</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-input border-border text-foreground" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm">Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="bg-input border-border text-foreground resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Preço (R$) *</Label>
                <Input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-input border-border text-foreground" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Unidade</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="un, h, mês..." className="bg-input border-border text-foreground" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm">Categoria</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Design, Desenvolvimento..." className="bg-input border-border text-foreground" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border text-foreground hover:bg-muted">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {loading ? "Salvando..." : editService ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

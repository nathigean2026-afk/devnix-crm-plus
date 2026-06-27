"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  inviteEmployee,
  cancelEmployeeInvite,
  updateEmployeePermissions,
  removeEmployee,
} from "@/lib/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Link2,
  Copy,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EmployeeData {
  employee: {
    id: string
    employeeId: string
    employeeName: string | null
    employeeEmail: string | null
    canClients: boolean
    canServices: boolean
    canQuotes: boolean
    canOrders: boolean
    canFinanceiro: boolean
    canRelatorios: boolean
  } | null
  pendingInvite: {
    id: string
    email: string
    token: string
    expiresAt: Date
    status: string
  } | null
}

interface PermissionToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

function PermissionToggle({ label, description, checked, onChange, disabled }: PermissionToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
          disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
          checked ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  )
}

interface EmployeeManagerProps {
  data: EmployeeData
  isEnterprise: boolean
}

export function EmployeeManager({ data: initialData, isEnterprise }: EmployeeManagerProps) {
  const [data, setData] = useState<EmployeeData>(initialData)
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()
  const [inviteResult, setInviteResult] = useState<{ token: string } | null>(null)
  const [savingPerms, setSavingPerms] = useState(false)

  const { employee, pendingInvite } = data

  // Permissões editáveis localmente antes de salvar
  const [perms, setPerms] = useState({
    canClients: employee?.canClients ?? false,
    canServices: employee?.canServices ?? false,
    canQuotes: employee?.canQuotes ?? false,
    canOrders: employee?.canOrders ?? false,
    canFinanceiro: employee?.canFinanceiro ?? false,
    canRelatorios: employee?.canRelatorios ?? false,
  })

  function handlePermChange(key: keyof typeof perms, value: boolean) {
    setPerms(p => ({ ...p, [key]: value }))
  }

  async function handleSavePerms() {
    if (!employee) return
    setSavingPerms(true)
    try {
      await updateEmployeePermissions(employee.id, perms)
      toast.success("Permissões atualizadas com sucesso.")
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar permissões.")
    } finally {
      setSavingPerms(false)
    }
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    startTransition(async () => {
      try {
        const result = await inviteEmployee(email.trim())
        setInviteResult(result)
        setData(d => ({
          ...d,
          pendingInvite: {
            id: "new",
            email: email.trim(),
            token: result.token,
            expiresAt: new Date(result.expiresAt),
            status: "pending",
          },
        }))
        setEmail("")
        toast.success("Convite criado com sucesso.")
      } catch (err: any) {
        toast.error(err?.message ?? "Erro ao enviar convite.")
      }
    })
  }

  async function handleCancelInvite() {
    if (!pendingInvite || pendingInvite.id === "new") return
    startTransition(async () => {
      try {
        await cancelEmployeeInvite(pendingInvite.id)
        setData(d => ({ ...d, pendingInvite: null }))
        setInviteResult(null)
        toast.success("Convite cancelado.")
      } catch (err: any) {
        toast.error(err?.message ?? "Erro ao cancelar convite.")
      }
    })
  }

  async function handleRemoveEmployee() {
    if (!employee) return
    if (!confirm("Tem certeza que deseja remover o funcionário? Ele perderá acesso imediatamente.")) return
    startTransition(async () => {
      try {
        await removeEmployee(employee.id)
        setData({ employee: null, pendingInvite: null })
        toast.success("Funcionário removido.")
      } catch (err: any) {
        toast.error(err?.message ?? "Erro ao remover funcionario.")
      }
    })
  }

  const inviteLink =
    typeof window !== "undefined" && (inviteResult?.token || pendingInvite?.token)
      ? `${window.location.origin}/aceitar-convite?token=${inviteResult?.token ?? pendingInvite?.token}`
      : null

  const PERMS_CONFIG = [
    { key: "canClients" as const,    label: "Clientes",         description: "Pode visualizar, criar e editar clientes." },
    { key: "canServices" as const,   label: "Serviços",         description: "Pode visualizar, criar e editar serviços." },
    { key: "canQuotes" as const,     label: "Orçamentos",       description: "Pode criar, editar e enviar orçamentos." },
    { key: "canOrders" as const,     label: "Ordens de Serviço",description: "Pode criar e gerenciar ordens de serviço." },
    { key: "canFinanceiro" as const, label: "Financeiro",       description: "Pode visualizar transações (somente leitura)." },
    { key: "canRelatorios" as const, label: "Relatórios",       description: "Pode acessar relatórios e gráficos." },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <CardTitle className="text-foreground text-lg">Funcionário</CardTitle>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5 ml-auto">
            Enterprise
          </Badge>
        </div>
        <CardDescription className="text-muted-foreground">
          Convide 1 funcionário para acessar o sistema com permissões que você define.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {!isEnterprise ? (
          /* Plano nao Enterprise */
          <div className="rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center gap-3 py-10 px-6 text-center">
            <Users className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Disponível no plano Enterprise</p>
              <p className="text-xs text-muted-foreground mt-1">
                Faça upgrade para adicionar um funcionário e definir suas permissões de acesso.
              </p>
            </div>
            <a
              href="/planos?renovar=1"
              className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              Ver plano Enterprise
            </a>
          </div>
        ) : employee ? (
          /* Funcionario ativo */
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-green-500/15 flex items-center justify-center">
                  <CheckCircle2 className="size-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {employee.employeeName ?? "Funcionário"}
                  </p>
                  <p className="text-xs text-muted-foreground">{employee.employeeEmail}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveEmployee}
                disabled={isPending}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              >
                <Trash2 className="size-4 mr-1.5" />
                Remover
              </Button>
            </div>

            {/* Permissoes */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Permissões de acesso</p>
              </div>
              <div className="px-4 pb-2">
                {PERMS_CONFIG.map(({ key, label, description }) => (
                  <PermissionToggle
                    key={key}
                    label={label}
                    description={description}
                    checked={perms[key]}
                    onChange={v => handlePermChange(key, v)}
                  />
                ))}
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-border">
                <Button
                  onClick={handleSavePerms}
                  disabled={savingPerms}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="sm"
                >
                  {savingPerms ? "Salvando..." : "Salvar permissões"}
                </Button>
              </div>
            </div>
          </div>
        ) : pendingInvite ? (
          /* Convite pendente */
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <Clock className="size-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Convite pendente</p>
                  <p className="text-xs text-muted-foreground">{pendingInvite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expira em {new Date(pendingInvite.expiresAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelInvite}
                disabled={isPending}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              >
                Cancelar
              </Button>
            </div>

            {inviteLink && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Link2 className="size-4 text-muted-foreground shrink-0" />
                  <p className="text-xs font-medium text-foreground">Link de convite</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted rounded-lg px-3 py-2 text-muted-foreground truncate border border-border">
                    {inviteLink}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink)
                      toast.success("Link copiado!")
                    }}
                  >
                    <Copy className="size-3.5 mr-1.5" />
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Compartilhe este link com seu funcionário. Ele precisará estar cadastrado no sistema com o e-mail{" "}
                  <strong>{pendingInvite.email}</strong>.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Sem funcionario — formulario de convite */
          <form onSubmit={handleInvite} className="flex flex-col gap-4">
            <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 flex items-start gap-3">
              <UserPlus className="size-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                Convide um funcionário informando o e-mail cadastrado ou que ele irá cadastrar no sistema.
                Você define exatamente quais módulos ele pode acessar após a aceitação.
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="emp-email" className="text-foreground text-sm">
                <Mail className="size-3.5 inline mr-1.5" />
                E-mail do funcionário
              </Label>
              <div className="flex gap-2">
                <Input
                  id="emp-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="funcionario@email.com"
                  className="bg-input border-border flex-1"
                  required
                />
                <Button
                  type="submit"
                  disabled={isPending || !email.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                >
                  {isPending ? "Enviando..." : "Convidar"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

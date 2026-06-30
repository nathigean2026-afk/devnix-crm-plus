"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import {
  inviteEmployee,
  cancelEmployeeInvite,
  updateEmployeePermissions,
  removeEmployee,
  getActivityLog,
} from "@/lib/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  UsersRound,
  UserPlus,
  Mail,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Link2,
  Copy,
  ClipboardList,
  Plus,
  Pencil,
  Send,
  LayoutDashboard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActivityLog } from "@/lib/db/schema"

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
    canDashboard: boolean
    canDelete: boolean
    canSendQuotes: boolean
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
  danger?: boolean
}

function PermissionToggle({ label, description, checked, onChange, disabled, danger }: PermissionToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", danger ? "text-destructive" : "text-foreground")}>{label}</p>
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
          checked
            ? danger ? "bg-destructive" : "bg-primary"
            : "bg-muted-foreground/30"
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

// Ícone por tipo de ação no log
function ActionIcon({ action }: { action: string }) {
  if (action === "create") return <Plus className="size-3.5 text-green-500 shrink-0" />
  if (action === "delete") return <Trash2 className="size-3.5 text-destructive shrink-0" />
  if (action === "send")   return <Send className="size-3.5 text-blue-500 shrink-0" />
  return <Pencil className="size-3.5 text-muted-foreground shrink-0" />
}

// Badge de módulo colorido
function ModuleBadge({ module }: { module: string }) {
  const map: Record<string, string> = {
    clientes:   "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    servicos:   "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    orcamentos: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    ordens:     "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    financeiro: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }
  const label: Record<string, string> = {
    clientes: "Clientes", servicos: "Serviços", orcamentos: "Orçamentos",
    ordens: "OS", financeiro: "Financeiro",
  }
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium", map[module] ?? "bg-muted text-muted-foreground")}>
      {label[module] ?? module}
    </span>
  )
}

interface EmployeeManagerProps {
  data: EmployeeData
  isEnterprise: boolean
}

type ActiveTab = "permissoes" | "log"

export function EmployeeManager({ data: initialData, isEnterprise }: EmployeeManagerProps) {
  const [data, setData] = useState<EmployeeData>(initialData)
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()
  const [inviteResult, setInviteResult] = useState<{ token: string } | null>(null)
  const [savingPerms, setSavingPerms] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>("permissoes")
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const { employee, pendingInvite } = data

  const [perms, setPerms] = useState({
    canClients:    employee?.canClients    ?? false,
    canServices:   employee?.canServices   ?? false,
    canQuotes:     employee?.canQuotes     ?? false,
    canOrders:     employee?.canOrders     ?? false,
    canFinanceiro: employee?.canFinanceiro ?? false,
    canRelatorios: employee?.canRelatorios ?? false,
    canDashboard:  employee?.canDashboard  ?? true,
    canDelete:     employee?.canDelete     ?? false,
    canSendQuotes: employee?.canSendQuotes ?? false,
  })

  // Carrega log quando aba é selecionada
  useEffect(() => {
    if (activeTab !== "log" || !employee) return
    setLoadingLogs(true)
    getActivityLog(200)
      .then(rows => setLogs(rows as ActivityLog[]))
      .catch(() => toast.error("Erro ao carregar log."))
      .finally(() => setLoadingLogs(false))
  }, [activeTab, employee])

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

  // Grupos de permissões para melhor organização visual
  const PERMS_MODULOS = [
    { key: "canDashboard"  as const, label: "Dashboard",         description: "Pode visualizar o painel com métricas e resumo financeiro.", icon: <LayoutDashboard className="size-3.5" /> },
    { key: "canClients"    as const, label: "Clientes",           description: "Pode visualizar, criar e editar clientes." },
    { key: "canServices"   as const, label: "Serviços",           description: "Pode visualizar, criar e editar serviços." },
    { key: "canQuotes"     as const, label: "Orçamentos",         description: "Pode criar e editar orçamentos (rascunho)." },
    { key: "canOrders"     as const, label: "Ordens de Serviço",  description: "Pode criar e gerenciar ordens de serviço." },
    { key: "canFinanceiro" as const, label: "Financeiro",         description: "Pode visualizar transações (somente leitura)." },
    { key: "canRelatorios" as const, label: "Relatórios",         description: "Pode acessar relatórios e gráficos." },
  ]

  const PERMS_ACOES = [
    { key: "canSendQuotes" as const, label: "Enviar orçamentos",    description: "Pode enviar orçamentos ao cliente para aprovação.", danger: false },
    { key: "canDelete"     as const, label: "Excluir registros",    description: "Pode excluir clientes, serviços, orçamentos, OSs e transações.", danger: true },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <UsersRound className="size-5 text-primary" />
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
          <div className="rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center gap-3 py-10 px-6 text-center">
            <UsersRound className="size-8 text-muted-foreground" />
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
          <div className="flex flex-col gap-4">
            {/* Card do funcionário ativo */}
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

            {/* Abas: Permissões | Log */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Tab header */}
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("permissoes")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                    activeTab === "permissoes"
                      ? "border-b-2 border-primary text-primary -mb-px"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ShieldCheck className="size-4" />
                  Permissões
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("log")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                    activeTab === "log"
                      ? "border-b-2 border-primary text-primary -mb-px"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ClipboardList className="size-4" />
                  Log de atividades
                </button>
              </div>

              {activeTab === "permissoes" && (
                <div className="flex flex-col">
                  {/* Módulos */}
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Acesso a módulos
                    </p>
                  </div>
                  <div className="px-4">
                    {PERMS_MODULOS.map(({ key, label, description }) => (
                      <PermissionToggle
                        key={key}
                        label={label}
                        description={description}
                        checked={perms[key]}
                        onChange={v => handlePermChange(key, v)}
                      />
                    ))}
                  </div>

                  {/* Ações especiais */}
                  <div className="px-4 pt-3 pb-1 border-t border-border mt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Ações especiais
                    </p>
                  </div>
                  <div className="px-4">
                    {PERMS_ACOES.map(({ key, label, description, danger }) => (
                      <PermissionToggle
                        key={key}
                        label={label}
                        description={description}
                        checked={perms[key]}
                        onChange={v => handlePermChange(key, v)}
                        danger={danger}
                      />
                    ))}
                  </div>

                  <div className="px-4 pb-4 pt-3 border-t border-border">
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
              )}

              {activeTab === "log" && (
                <div className="flex flex-col">
                  {loadingLogs ? (
                    <div className="py-10 flex items-center justify-center text-muted-foreground text-sm">
                      Carregando...
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2 text-center px-6">
                      <ClipboardList className="size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
                      <p className="text-xs text-muted-foreground">As ações do funcionário aparecerão aqui.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border max-h-96 overflow-y-auto">
                      {logs.map(log => (
                        <li key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="mt-0.5">
                            <ActionIcon action={log.action} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-snug">{log.description}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <ModuleBadge module={log.module} />
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(log.createdAt).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : pendingInvite ? (
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

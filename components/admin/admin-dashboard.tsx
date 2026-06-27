"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { PromoCode } from "@/lib/db/schema"
import {
  adminCreatePromoCode, adminDeletePromoCode,
  adminUpdateUser, adminSendPasswordReset, adminExtendLicense, adminRevokeAccess,
  adminGetPayments,
} from "@/lib/actions"
import { AdminTickets } from "@/components/admin/admin-tickets"
import { toast } from "sonner"
import {
  Users, ShieldCheck, Tag, BarChart3, LogOut, Plus, Trash2,
  CheckCircle2, XCircle, Clock, RefreshCw, LifeBuoy, Wifi, WifiOff,
  Sun, Moon, TrendingUp, Database, Zap, AlertTriangle, Eye, Edit2,
  KeyRound, Ban, PlusCircle, ChevronDown, ChevronUp, Activity,
  DollarSign, Calendar, Globe, Monitor, Filter, Search, X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const PLANS = ["Starter", "Professional", "Enterprise"]

type SessionRow = {
  userId: string
  ipAddress: string | null
  userAgent: string | null
  updatedAt: Date
}

type LicenseRow = {
  userId: string
  userName: string
  userEmail: string
  userCreatedAt: Date
  accessExpiresAt: Date | null
  profileName: string | null
  profileEmail: string | null
  licensePlan: string | null
  lastSessionIp: string | null
  lastSessionAt: Date | null
  lastUserAgent: string | null
}

type GeoInfo = { city: string; region: string; isp: string; country: string }

type PaymentRow = {
  id: string
  mpPaymentId: string
  planId: string
  planName: string
  amountCents: number
  status: string
  paymentMethod: string
  durationDays: number
  paidAt: Date | null
  expiresLicenseAt: Date | null
  createdAt: Date
  userName: string | null
  userEmail: string | null
}

interface StatsData {
  totalUsers: number
  activeUsers: number
  expiredUsers: number
  totalCodes: number
  usedCodes: number
  openTickets: number
  onlineSessions: SessionRow[]
  licenseData: LicenseRow[]
  dailyLogins: { day: string; logins: number }[]
  dbMetrics: { size: string; sizeBytes: number; connections: number; latencyMs: number; tableCount: number } | null
  subscriptionStats: { day: number; week: number; month: number; total: number }
  revenueStats: { totalCents: number; dayCents: number; weekCents: number; monthCents: number; totalCount: number }
}

type TicketRow = {
  id: string; subject: string; category: string; status: string; priority: string
  createdAt: Date; updatedAt: Date; userId: string; userName: string | null; userEmail: string | null
  licensePlan?: string | null
}

// Todas as formatações usam timeZone: "UTC" para evitar mismatch de hidratação
// entre servidor (UTC) e cliente (fuso local)
function formatDate(d: Date | string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
}

function formatDateTime(d: Date | string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
}

function formatDayLabel(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
}

function daysLeft(d: Date | string | null) {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

function parseIp(ip: string | null) {
  if (!ip) return "—"
  const clean = ip.replace(/^::ffff:/, "")
  if (clean === "::1" || clean === "127.0.0.1") return "Localhost"
  return clean
}

function StatCard({ icon: Icon, label, value, sub, color, onClick, active }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color: string; onClick?: () => void; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 flex items-center gap-4 text-left transition-all",
        onClick ? "cursor-pointer hover:border-white/20" : "cursor-default",
        active ? "border-white/30 bg-white/8" : "border-white/8 bg-white/4",
      )}
    >
      <div className={cn("size-11 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon className="size-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-white/50 mt-1 leading-snug">{label}</p>
        {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
      </div>
    </button>
  )
}

type Tab = "visao" | "licencas" | "usuarios" | "codigos" | "suporte" | "metricas" | "pagamentos"

export default function AdminDashboard({
  stats: initialStats, codes, tickets,
}: {
  stats: StatsData; codes: PromoCode[]; tickets: TicketRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<Tab>("visao")
  const [darkMode, setDarkMode] = useState(true)
  const [promoForm, setPromoForm] = useState({ code: "", planName: "Starter", days: 30, expiresAt: "" })
  const [showForm, setShowForm] = useState(false)
  const [localCodes, setLocalCodes] = useState(codes)
  const [stats] = useState(initialStats)
  const [userSearch, setUserSearch] = useState("")
  const [userFilter, setUserFilter] = useState<"todos" | "ativos" | "expirados" | "online">("todos")
  const [editingUser, setEditingUser] = useState<LicenseRow | null>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "", accessExpiresAt: "" })
  const [extendDays, setExtendDays] = useState(30)
  const [resetLink, setResetLink] = useState<string | null>(null)
  const [geoData, setGeoData] = useState<Record<string, GeoInfo>>({})
  const [geoLoading, setGeoLoading] = useState(false)
  const [paymentsList, setPaymentsList] = useState<PaymentRow[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentFilter, setPaymentFilter] = useState<"todos" | "approved" | "pending" | "rejected">("todos")

  const onlineUserIds = new Set(stats.onlineSessions.map(s => s.userId))

  // Carrega geolocalização dos IPs quando muda para aba usuarios ou metricas
  const loadGeoData = useCallback(async () => {
    const ips = [
      ...stats.licenseData.map(u => u.lastSessionIp).filter(Boolean),
      ...stats.onlineSessions.map(s => s.ipAddress).filter(Boolean),
    ].filter((ip, i, a) => a.indexOf(ip) === i) as string[]
    if (ips.length === 0 || geoLoading) return
    setGeoLoading(true)
    try {
      const res = await fetch("/api/admin/geoip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ips }),
      })
      if (res.ok) setGeoData(await res.json())
    } catch { /* opcional */ }
    finally { setGeoLoading(false) }
  }, [stats.licenseData, stats.onlineSessions, geoLoading])

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" })
    router.push("/admin/login")
  }

  async function handleCreateCode(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await adminCreatePromoCode({ code: promoForm.code, planName: promoForm.planName, days: promoForm.days, expiresAt: promoForm.expiresAt || undefined })
        toast.success(`Código ${promoForm.code.toUpperCase()} criado!`)
        setPromoForm({ code: "", planName: "Starter", days: 30, expiresAt: "" })
        setShowForm(false)
        router.refresh()
      } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao criar código.") }
    })
  }

  async function handleDeleteCode(id: string, code: string) {
    if (!confirm(`Excluir o código ${code}?`)) return
    startTransition(async () => {
      try {
        await adminDeletePromoCode(id)
        setLocalCodes(c => c.filter(x => x.id !== id))
        toast.success("Código removido.")
      } catch { toast.error("Erro ao remover código.") }
    })
  }

  function generateRandomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 12; i++) {
      if (i === 4 || i === 8) code += "-"
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    setPromoForm(f => ({ ...f, code }))
  }

  function openEditUser(u: LicenseRow) {
    setEditingUser(u)
    setResetLink(null)
    setEditForm({
      name: u.profileName || u.userName,
      email: u.profileEmail || u.userEmail,
      accessExpiresAt: u.accessExpiresAt ? new Date(u.accessExpiresAt).toISOString().split("T")[0] : "",
    })
  }

  async function handleSaveEdit() {
    if (!editingUser) return
    startTransition(async () => {
      try {
        await adminUpdateUser(editingUser.userId, {
          name: editForm.name,
          email: editForm.email,
          accessExpiresAt: editForm.accessExpiresAt || undefined,
        })
        toast.success("Dados atualizados!")
        setEditingUser(null)
        router.refresh()
      } catch { toast.error("Erro ao atualizar usuário.") }
    })
  }

  async function handleSendReset() {
    if (!editingUser) return
    startTransition(async () => {
      try {
        const link = await adminSendPasswordReset(editingUser.userId)
        setResetLink(link)
        toast.success("Link gerado! Copie e envie ao usuário.")
      } catch { toast.error("Erro ao gerar link.") }
    })
  }

  async function handleExtendLicense() {
    if (!editingUser) return
    startTransition(async () => {
      try {
        const newDate = await adminExtendLicense(editingUser.userId, extendDays)
        toast.success(`Licença estendida até ${formatDate(newDate)}`)
        setEditingUser(null)
        router.refresh()
      } catch { toast.error("Erro ao estender licença.") }
    })
  }

  async function handleRevokeAccess() {
    if (!editingUser) return
    if (!confirm("Revogar acesso imediatamente?")) return
    startTransition(async () => {
      try {
        await adminRevokeAccess(editingUser.userId)
        toast.success("Acesso revogado.")
        setEditingUser(null)
        router.refresh()
      } catch { toast.error("Erro ao revogar acesso.") }
    })
  }

  const filteredUsers = stats.licenseData.filter(u => {
    const search = userSearch.toLowerCase()
    const matchSearch = !search ||
      (u.profileName || u.userName).toLowerCase().includes(search) ||
      (u.profileEmail || u.userEmail).toLowerCase().includes(search)
    const days = daysLeft(u.accessExpiresAt)
    const isOnline = onlineUserIds.has(u.userId)
    const matchFilter =
      userFilter === "todos" ? true :
      userFilter === "ativos" ? (days !== null && days > 0) :
      userFilter === "expirados" ? (u.accessExpiresAt !== null && (days === null || days <= 0)) :
      userFilter === "online" ? isOnline : true
    return matchSearch && matchFilter
  })

  const now = new Date()

  async function loadPayments() {
    if (paymentsLoading) return
    setPaymentsLoading(true)
    try {
      const data = await adminGetPayments()
      setPaymentsList(data as PaymentRow[])
    } catch { toast.error("Erro ao carregar pagamentos") }
    finally { setPaymentsLoading(false) }
  }

  function handleTabChange(t: Tab) {
    setTab(t)
    if ((t === "usuarios" || t === "metricas") && Object.keys(geoData).length === 0) {
      loadGeoData()
    }
    if (t === "pagamentos" && paymentsList.length === 0) {
      loadPayments()
    }
  }

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "visao", label: "Visão Geral", icon: BarChart3 },
    { key: "licencas", label: "Licenças", icon: ShieldCheck },
    { key: "usuarios", label: "Usuários", icon: Users },
    { key: "codigos", label: "Códigos", icon: Tag },
    { key: "suporte", label: `Suporte (${tickets.filter(t => t.status === "aberto" || t.status === "em_andamento").length})`, icon: LifeBuoy },
    { key: "metricas", label: "Métricas", icon: Activity },
    { key: "pagamentos", label: "Pagamentos", icon: DollarSign },
  ]

  return (
    <div className={cn("min-h-screen text-white", darkMode ? "dark bg-[#0a0a0f]" : "bg-slate-100")}>
      <div className={cn("min-h-screen", darkMode ? "bg-[#0a0a0f] text-white" : "bg-slate-100 text-slate-900")}>
        {/* Header */}
        <header className={cn(
          "border-b px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur",
          darkMode ? "border-white/8 bg-[#0a0a0f]/90" : "border-slate-200 bg-white/90"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("size-8 rounded-lg flex items-center justify-center", darkMode ? "bg-primary/20 border border-primary/30" : "bg-primary/10 border border-primary/20")}>
              <ShieldCheck className="size-4 text-primary" />
            </div>
            <div>
              <h1 className={cn("font-bold text-sm leading-none", darkMode ? "text-white" : "text-slate-900")}>Elevanthe CRM</h1>
              <p className={cn("text-xs mt-0.5", darkMode ? "text-white/40" : "text-slate-500")}>Painel de Controle</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(d => !d)}
              className={cn(
                "flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-colors",
                darkMode ? "text-white/50 border-white/10 hover:border-white/20 hover:text-white/80" : "text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              {darkMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              <span className="hidden sm:inline">{darkMode ? "Claro" : "Escuro"}</span>
            </button>
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-colors",
                darkMode ? "text-white/50 border-white/10 hover:border-white/20 hover:text-white/80" : "text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard icon={Users} label="Total usuários" value={stats.totalUsers} color="bg-blue-500/80" />
            <StatCard icon={CheckCircle2} label="Licenças ativas" value={stats.activeUsers} color="bg-emerald-500/80" />
            <StatCard icon={XCircle} label="Contas expiradas" value={stats.expiredUsers} color="bg-red-500/80" />
            <StatCard icon={Wifi} label="Online agora" value={stats.onlineSessions.length} sub="últimos 15 min" color="bg-cyan-500/80" onClick={() => { handleTabChange("usuarios"); setUserFilter("online") }} active={tab === "usuarios" && userFilter === "online"} />
            <StatCard icon={LifeBuoy} label="Tickets abertos" value={stats.openTickets} color="bg-amber-500/80" onClick={() => handleTabChange("suporte")} active={tab === "suporte"} />
            <StatCard icon={DollarSign} label="Receita total" value={`R$ ${(stats.revenueStats.totalCents / 100).toFixed(2)}`} sub={`${stats.revenueStats.totalCount} pagamentos aprovados`} color="bg-emerald-600/80" onClick={() => handleTabChange("pagamentos")} active={tab === "pagamentos"} />
            <StatCard icon={Tag} label="Códigos usados" value={`${stats.usedCodes}/${stats.totalCodes}`} color="bg-purple-500/80" />
          </div>

          {/* Tabs */}
          <div className={cn(
            "flex gap-0.5 border rounded-xl p-1 mb-6 overflow-x-auto",
            darkMode ? "bg-white/4 border-white/8" : "bg-slate-100 border-slate-200"
          )}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all",
                  tab === t.key
                    ? darkMode ? "bg-primary text-white shadow" : "bg-primary text-white shadow"
                    : darkMode ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <t.icon className="size-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Visão Geral ── */}
          {tab === "visao" && (
            <div className="space-y-4">
              {/* Mini gráfico de logins */}
              <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="size-4 text-primary" />
                  <h2 className={cn("text-sm font-semibold", darkMode ? "text-white/70" : "text-slate-600")}>Logins diários — últimos 14 dias</h2>
                </div>
                {stats.dailyLogins.length === 0 ? (
                  <p className={cn("text-xs", darkMode ? "text-white/30" : "text-slate-400")}>Sem dados suficientes.</p>
                ) : (
                  <div className="flex items-end gap-1 h-20">
                    {stats.dailyLogins.map((d) => {
                      const max = Math.max(...stats.dailyLogins.map(x => x.logins), 1)
                      const h = Math.max((d.logins / max) * 100, 6)
                      return (
                        <div key={d.day} className="flex flex-col items-center gap-1 flex-1 group" title={`${d.day}: ${d.logins} login(s)`}>
                          <div
                            style={{ height: `${h}%` }}
                            className="w-full rounded-sm bg-primary/50 group-hover:bg-primary transition-colors min-h-[4px]"
                          />
                          <span className={cn("text-[9px] rotate-45 origin-left mt-1", darkMode ? "text-white/20" : "text-slate-400")}>
                            {formatDayLabel(d.day)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Usuários recentes */}
              <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                <h2 className={cn("text-sm font-semibold mb-4 uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>Usuários recentes</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cn("text-xs border-b", darkMode ? "text-white/40 border-white/10" : "text-slate-400 border-slate-100")}>
                        <th className="text-left pb-2 font-medium pr-4">Nome</th>
                        <th className="text-left pb-2 font-medium pr-4">E-mail</th>
                        <th className="text-left pb-2 font-medium pr-4">Plano</th>
                        <th className="text-left pb-2 font-medium pr-4">Último acesso</th>
                        <th className="text-left pb-2 font-medium pr-4">IP</th>
                        <th className="text-left pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.licenseData.slice(0, 10).map((u) => {
                        const days = daysLeft(u.accessExpiresAt)
                        const isActive = days !== null && days > 0
                        const isOnline = onlineUserIds.has(u.userId)
                        return (
                          <tr key={u.userId} className={cn("border-b transition-colors", darkMode ? "border-white/5 hover:bg-white/3" : "border-slate-50 hover:bg-slate-50")}>
                            <td className="py-2.5 pr-4">
                              <div className="flex items-center gap-2">
                                {isOnline && <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" title="Online" />}
                                <span className={cn("font-medium", darkMode ? "text-white" : "text-slate-800")}>{u.profileName || u.userName}</span>
                              </div>
                            </td>
                            <td className={cn("py-2.5 pr-4 text-xs", darkMode ? "text-white/60" : "text-slate-500")}>{u.profileEmail || u.userEmail}</td>
                            <td className="py-2.5 pr-4">
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize">{u.licensePlan ?? "starter"}</span>
                            </td>
                            <td className={cn("py-2.5 pr-4 text-xs", darkMode ? "text-white/50" : "text-slate-400")}>{formatDateTime(u.lastSessionAt)}</td>
                            <td className={cn("py-2.5 pr-4 text-xs font-mono", darkMode ? "text-white/40" : "text-slate-400")}>{parseIp(u.lastSessionIp)}</td>
                            <td className="py-2.5">
                              {isActive ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="size-3.5" />{days}d</span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="size-3.5" />Expirada</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Licenças ── */}
          {tab === "licencas" && (
            <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
              <h2 className={cn("text-sm font-semibold mb-4 uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>Todas as licenças</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn("text-xs border-b", darkMode ? "text-white/40 border-white/10" : "text-slate-400 border-slate-100")}>
                      <th className="text-left pb-2 font-medium pr-4">Empresa</th>
                      <th className="text-left pb-2 font-medium pr-4">E-mail</th>
                      <th className="text-left pb-2 font-medium pr-4">Plano</th>
                      <th className="text-left pb-2 font-medium pr-4">Cadastro</th>
                      <th className="text-left pb-2 font-medium pr-4">Vencimento</th>
                      <th className="text-left pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.licenseData.map((u) => {
                      const days = daysLeft(u.accessExpiresAt)
                      const isActive = days !== null && days > 0
                      const isWarning = isActive && days! <= 7
                      return (
                        <tr key={u.userId} className={cn("border-b transition-colors", darkMode ? "border-white/5 hover:bg-white/3" : "border-slate-50 hover:bg-slate-50")}>
                          <td className={cn("py-2.5 pr-4 font-medium", darkMode ? "text-white" : "text-slate-800")}>{u.profileName || u.userName}</td>
                          <td className={cn("py-2.5 pr-4 text-xs", darkMode ? "text-white/60" : "text-slate-500")}>{u.profileEmail || u.userEmail}</td>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize">{u.licensePlan ?? "starter"}</span>
                          </td>
                          <td className={cn("py-2.5 pr-4 text-xs", darkMode ? "text-white/50" : "text-slate-400")}>{formatDate(u.userCreatedAt)}</td>
                          <td className={cn("py-2.5 pr-4 text-xs", darkMode ? "text-white/60" : "text-slate-500")}>{formatDate(u.accessExpiresAt)}</td>
                          <td className="py-2.5">
                            {isActive ? (
                              <span className={cn("flex items-center gap-1 text-xs", isWarning ? "text-yellow-400" : "text-emerald-400")}>
                                {isWarning ? <Clock className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}{days}d
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="size-3.5" />Expirada</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tab: Usuários (online, IP, edição, reset senha) ── */}
          {tab === "usuarios" && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-wrap gap-2">
                <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 flex-1 min-w-48", darkMode ? "bg-white/4 border-white/10" : "bg-white border-slate-200")}>
                  <Search className={cn("size-4 shrink-0", darkMode ? "text-white/40" : "text-slate-400")} />
                  <input
                    placeholder="Buscar por nome ou e-mail..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className={cn("bg-transparent text-sm outline-none flex-1 placeholder:text-current/40", darkMode ? "text-white placeholder:text-white/30" : "text-slate-700")}
                  />
                  {userSearch && <button onClick={() => setUserSearch("")}><X className="size-3.5 text-white/40" /></button>}
                </div>
                <div className="flex gap-1">
                  {(["todos", "ativos", "expirados", "online"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setUserFilter(f)}
                      className={cn(
                        "text-xs px-3 py-2 rounded-lg border capitalize transition-all",
                        userFilter === f
                          ? "bg-primary border-primary text-white"
                          : darkMode ? "border-white/10 text-white/50 hover:text-white/80" : "border-slate-200 text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {f === "todos" ? "Todos" : f === "ativos" ? "Ativos" : f === "expirados" ? "Expirados" : "Online"}
                      {f === "online" && stats.onlineSessions.length > 0 && (
                        <span className="ml-1.5 size-1.5 rounded-full bg-emerald-400 inline-block" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className={cn("rounded-xl border overflow-hidden", darkMode ? "border-white/8" : "border-slate-200")}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cn("text-xs border-b", darkMode ? "text-white/40 border-white/10 bg-white/3" : "text-slate-400 border-slate-100 bg-slate-50")}>
                        <th className="text-left px-4 py-3 font-medium">Usuário</th>
                        <th className="text-left px-4 py-3 font-medium">Plano / Assinatura</th>
                        <th className="text-left px-4 py-3 font-medium">Último acesso</th>
                        <th className="text-left px-4 py-3 font-medium">IP</th>
                        <th className="text-left px-4 py-3 font-medium">Localização</th>
                        <th className="text-left px-4 py-3 font-medium">Provedor</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className={cn("text-center py-10 text-sm", darkMode ? "text-white/30" : "text-slate-400")}>Nenhum usuário encontrado.</td>
                        </tr>
                      ) : filteredUsers.map((u) => {
                        const days = daysLeft(u.accessExpiresAt)
                        const isActive = days !== null && days > 0
                        const isOnline = onlineUserIds.has(u.userId)
                        return (
                          <tr key={u.userId} className={cn("border-b transition-colors", darkMode ? "border-white/5 hover:bg-white/3" : "border-slate-50 hover:bg-slate-50")}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="relative shrink-0">
                                  <div className={cn("size-8 rounded-full flex items-center justify-center text-xs font-bold", darkMode ? "bg-white/10 text-white" : "bg-slate-200 text-slate-600")}>
                                    {(u.profileName || u.userName).charAt(0).toUpperCase()}
                                  </div>
                                  {isOnline && <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0a0f]" />}
                                </div>
                                <div>
                                  <p className={cn("font-medium text-sm leading-none", darkMode ? "text-white" : "text-slate-800")}>{u.profileName || u.userName}</p>
                                  <p className={cn("text-xs mt-0.5", darkMode ? "text-white/50" : "text-slate-400")}>{u.profileEmail || u.userEmail}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize w-fit">{u.licensePlan ?? "starter"}</span>
                                <span className={cn("text-[10px]", darkMode ? "text-white/30" : "text-slate-400")}>
                                  {u.accessExpiresAt ? `vence ${formatDate(u.accessExpiresAt)}` : "sem data"}
                                </span>
                              </div>
                            </td>
                            <td className={cn("px-4 py-3 text-xs", darkMode ? "text-white/50" : "text-slate-400")}>
                              {formatDateTime(u.lastSessionAt)}
                            </td>
                            <td className={cn("px-4 py-3 text-xs font-mono", darkMode ? "text-white/40" : "text-slate-400")}>
                              {parseIp(u.lastSessionIp)}
                            </td>
                            <td className={cn("px-4 py-3 text-xs", darkMode ? "text-white/50" : "text-slate-400")}>
                              {(() => {
                                const geo = u.lastSessionIp ? geoData[u.lastSessionIp] : null
                                if (!geo) return geoLoading ? <span className="opacity-40">...</span> : <span className="opacity-30">—</span>
                                return <span title={`${geo.city}, ${geo.region}, ${geo.country}`}>{geo.city}{geo.region ? `, ${geo.region.slice(0,2)}` : ""}</span>
                              })()}
                            </td>
                            <td className={cn("px-4 py-3 text-xs max-w-28 truncate", darkMode ? "text-white/40" : "text-slate-400")}>
                              {(() => {
                                const geo = u.lastSessionIp ? geoData[u.lastSessionIp] : null
                                return geo?.isp ? <span title={geo.isp} className="truncate block">{geo.isp}</span> : <span className="opacity-30">—</span>
                              })()}
                            </td>
                            <td className="px-4 py-3">
                              {isActive ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="size-3.5" />{days}d</span>
                              ) : u.accessExpiresAt ? (
                                <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="size-3.5" />Expirada</span>
                              ) : (
                                <span className={cn("text-xs", darkMode ? "text-white/30" : "text-slate-400")}>Sem licença</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => openEditUser(u)}
                                className="inline-flex items-center gap-1 text-xs bg-primary/20 hover:bg-primary/40 text-primary px-2.5 py-1 rounded-lg transition-colors"
                              >
                                <Edit2 className="size-3" />Gerenciar
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Códigos Promo ── */}
          {tab === "codigos" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>Códigos Promocionais</h2>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                  <Plus className="size-4" />Novo código
                </button>
              </div>

              {showForm && (
                <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                  <h3 className={cn("text-sm font-semibold mb-4", darkMode ? "text-white" : "text-slate-800")}>Criar novo código</h3>
                  <form onSubmit={handleCreateCode} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={cn("text-xs", darkMode ? "text-white/60" : "text-slate-500")}>Código</label>
                      <div className="flex gap-2">
                        <input required value={promoForm.code} onChange={e => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="DEVNIX-TESTE-30D"
                          className={cn("flex-1 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-primary/50", darkMode ? "bg-white/5 border border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border border-slate-200 text-slate-800")} />
                        <button type="button" onClick={generateRandomCode} className={cn("px-2.5 rounded-lg hover:opacity-80 transition-colors", darkMode ? "bg-white/5 border border-white/10" : "bg-slate-100 border border-slate-200")}>
                          <RefreshCw className={cn("size-4", darkMode ? "text-white/50" : "text-slate-400")} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={cn("text-xs", darkMode ? "text-white/60" : "text-slate-500")}>Plano</label>
                      <select value={promoForm.planName} onChange={e => setPromoForm(f => ({ ...f, planName: e.target.value }))}
                        className={cn("rounded-lg px-3 py-2 text-sm focus:outline-none", darkMode ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border border-slate-200 text-slate-800")}>
                        {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={cn("text-xs", darkMode ? "text-white/60" : "text-slate-500")}>Dias concedidos</label>
                      <input type="number" required min={1} max={3650} value={promoForm.days} onChange={e => setPromoForm(f => ({ ...f, days: Number(e.target.value) }))}
                        className={cn("rounded-lg px-3 py-2 text-sm focus:outline-none", darkMode ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border border-slate-200 text-slate-800")} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={cn("text-xs", darkMode ? "text-white/60" : "text-slate-500")}>Expiração do código (opcional)</label>
                      <input type="date" value={promoForm.expiresAt} onChange={e => setPromoForm(f => ({ ...f, expiresAt: e.target.value }))}
                        className={cn("rounded-lg px-3 py-2 text-sm focus:outline-none", darkMode ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border border-slate-200 text-slate-800")} />
                    </div>
                    <div className="sm:col-span-2 flex gap-3 justify-end">
                      <button type="button" onClick={() => setShowForm(false)} className={cn("text-sm px-4 py-2 border rounded-lg transition-colors", darkMode ? "text-white/50 border-white/10 hover:text-white/80" : "text-slate-500 border-slate-200")}>Cancelar</button>
                      <button type="submit" disabled={isPending} className="text-sm bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg disabled:opacity-60">
                        {isPending ? "Criando..." : "Criar código"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className={cn("rounded-xl border overflow-hidden", darkMode ? "border-white/8" : "border-slate-200")}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cn("text-xs border-b", darkMode ? "text-white/40 border-white/10 bg-white/3" : "text-slate-400 border-slate-100 bg-slate-50")}>
                        <th className="text-left px-4 py-3 font-medium">Código</th>
                        <th className="text-left px-4 py-3 font-medium">Plano</th>
                        <th className="text-left px-4 py-3 font-medium">Dias</th>
                        <th className="text-left px-4 py-3 font-medium">Expira (código)</th>
                        <th className="text-left px-4 py-3 font-medium">Usado por</th>
                        <th className="text-left px-4 py-3 font-medium">Usado em</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {localCodes.length === 0 ? (
                        <tr><td colSpan={8} className={cn("text-center py-8 text-sm", darkMode ? "text-white/30" : "text-slate-400")}>Nenhum código criado ainda.</td></tr>
                      ) : localCodes.map((c) => {
                        const expired = c.expiresAt && new Date(c.expiresAt) < now
                        return (
                          <tr key={c.id} className={cn("border-b transition-colors", darkMode ? "border-white/5 hover:bg-white/3" : "border-slate-50 hover:bg-slate-50")}>
                            <td className={cn("px-4 py-3 font-mono text-xs tracking-wider", darkMode ? "text-white" : "text-slate-800")}>{c.code}</td>
                            <td className="px-4 py-3"><span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{c.planName}</span></td>
                            <td className={cn("px-4 py-3 font-semibold", darkMode ? "text-white/80" : "text-slate-700")}>+{c.days}d</td>
                            <td className={cn("px-4 py-3 text-xs", darkMode ? "text-white/50" : "text-slate-400")}>{c.expiresAt ? formatDate(c.expiresAt) : "—"}</td>
                            <td className={cn("px-4 py-3 text-xs font-mono", darkMode ? "text-white/50" : "text-slate-400")}>{c.usedBy ? c.usedBy.slice(0, 8) + "..." : "—"}</td>
                            <td className={cn("px-4 py-3 text-xs", darkMode ? "text-white/50" : "text-slate-400")}>{formatDateTime(c.usedAt)}</td>
                            <td className="px-4 py-3">
                              {c.usedBy
                                ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="size-3.5" />Usado</span>
                                : expired
                                  ? <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="size-3.5" />Expirado</span>
                                  : <span className="flex items-center gap-1 text-xs text-blue-400"><Clock className="size-3.5" />Disponível</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!c.usedBy && (
                                <button onClick={() => handleDeleteCode(c.id, c.code)} className="text-red-400 hover:text-red-300 transition-colors" title="Excluir">
                                  <Trash2 className="size-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Suporte ── */}
          {tab === "suporte" && (
            <div className="dark">
              <AdminTickets initialTickets={tickets} />
            </div>
          )}

          {/* ── Tab: Métricas ── */}
          {tab === "metricas" && (
            <div className="space-y-4">
              {/* Assinaturas por período */}
              <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="size-4 text-emerald-400" />
                  <h2 className={cn("text-sm font-semibold", darkMode ? "text-white/70" : "text-slate-600")}>Assinaturas ativas por período</h2>
                  <span className={cn("ml-auto text-xs px-2 py-0.5 rounded-full", darkMode ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500")}>contagem de contas com licença válida</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Renovadas hoje", value: stats.subscriptionStats.day, color: "text-cyan-400" },
                    { label: "Renovadas na semana", value: stats.subscriptionStats.week, color: "text-blue-400" },
                    { label: "Renovadas no mês", value: stats.subscriptionStats.month, color: "text-indigo-400" },
                    { label: "Total com licença ativa", value: stats.subscriptionStats.total, color: "text-emerald-400" },
                  ].map(item => (
                    <div key={item.label} className={cn("rounded-lg border p-3", darkMode ? "bg-white/3 border-white/8" : "bg-slate-50 border-slate-100")}>
                      <p className={cn("text-2xl font-bold", item.color)}>{item.value}</p>
                      <p className={cn("text-xs mt-1", darkMode ? "text-white/40" : "text-slate-400")}>{item.label}</p>
                    </div>
                  ))}
                </div>
                <p className={cn("text-xs mt-3 border-t pt-3", darkMode ? "text-white/25 border-white/8" : "text-slate-400 border-slate-100")}>
                  Pagamentos processados via <strong>Mercado Pago</strong> — PIX, cartao de credito e boleto. Os valores sao registrados automaticamente apos confirmacao do pagamento. Veja o historico completo na aba Pagamentos.
                </p>
              </div>

              {/* Métricas do banco */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="size-4 text-blue-400" />
                    <span className={cn("text-xs font-medium", darkMode ? "text-white/60" : "text-slate-500")}>Tamanho do banco</span>
                  </div>
                  <p className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-slate-800")}>{stats.dbMetrics?.size ?? "calculando..."}</p>
                  {stats.dbMetrics?.sizeBytes ? (
                    <p className={cn("text-xs mt-1", darkMode ? "text-white/30" : "text-slate-400")}>{(stats.dbMetrics.sizeBytes / 1024 / 1024).toFixed(2)} MB bruto</p>
                  ) : null}
                </div>
                <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="size-4 text-yellow-400" />
                    <span className={cn("text-xs font-medium", darkMode ? "text-white/60" : "text-slate-500")}>Latência (ping)</span>
                  </div>
                  <p className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-slate-800")}>
                    {stats.dbMetrics?.latencyMs != null ? `${stats.dbMetrics.latencyMs}ms` : "—"}
                  </p>
                  <p className={cn("text-xs mt-1", darkMode ? "text-white/30" : "text-slate-400")}>
                    {stats.dbMetrics?.latencyMs != null
                      ? stats.dbMetrics.latencyMs < 50 ? "Excelente" : stats.dbMetrics.latencyMs < 150 ? "Bom" : "Lento"
                      : ""}
                  </p>
                </div>
                <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="size-4 text-emerald-400" />
                    <span className={cn("text-xs font-medium", darkMode ? "text-white/60" : "text-slate-500")}>Tabelas no banco</span>
                  </div>
                  <p className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-slate-800")}>{stats.dbMetrics?.tableCount ?? "—"}</p>
                </div>
                <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="size-4 text-cyan-400" />
                    <span className={cn("text-xs font-medium", darkMode ? "text-white/60" : "text-slate-500")}>Sessões online (15 min)</span>
                  </div>
                  <p className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-slate-800")}>{stats.onlineSessions.length}</p>
                </div>
              </div>

              {/* Sessões online detalhadas */}
              <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                <div className="flex items-center gap-2 mb-4">
                  <Wifi className="size-4 text-emerald-400" />
                  <h2 className={cn("text-sm font-semibold", darkMode ? "text-white/70" : "text-slate-600")}>Sessões ativas agora</h2>
                  <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{stats.onlineSessions.length} online</span>
                </div>
                {stats.onlineSessions.length === 0 ? (
                  <p className={cn("text-xs", darkMode ? "text-white/30" : "text-slate-400")}>Nenhuma sessão ativa no momento.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.onlineSessions.map((s, i) => {
                      const matchUser = stats.licenseData.find(u => u.userId === s.userId)
                      const cleanIp = s.ipAddress?.replace(/^::ffff:/, "") ?? null
                      const geo = cleanIp ? (geoData[s.ipAddress!] || geoData[cleanIp]) : null
                      return (
                        <div key={i} className={cn("flex items-center gap-3 rounded-lg p-3", darkMode ? "bg-white/3" : "bg-slate-50")}>
                          <span className="size-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium truncate", darkMode ? "text-white" : "text-slate-800")}>
                              {matchUser ? (matchUser.profileName || matchUser.userName) : s.userId.slice(0, 8)}
                            </p>
                            <p className={cn("text-xs truncate", darkMode ? "text-white/40" : "text-slate-400")}>
                              {matchUser ? (matchUser.profileEmail || matchUser.userEmail) : ""}
                            </p>
                          </div>
                          <div className={cn("text-right space-y-0.5", darkMode ? "text-white/40" : "text-slate-400")}>
                            <p className="text-xs font-mono">{parseIp(s.ipAddress)}</p>
                            {geo && <p className="text-xs">{geo.city}{geo.region ? `, ${geo.region.slice(0,2)}` : ""} · {geo.isp}</p>}
                            <p className="text-xs">{formatDateTime(s.updatedAt)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Logins por dia */}
              <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="size-4 text-primary" />
                  <h2 className={cn("text-sm font-semibold", darkMode ? "text-white/70" : "text-slate-600")}>Logins por dia</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={cn("border-b", darkMode ? "text-white/30 border-white/10" : "text-slate-400 border-slate-100")}>
                        <th className="text-left pb-2 font-medium">Data</th>
                        <th className="text-left pb-2 font-medium">Sessões</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {stats.dailyLogins.map(d => {
                        const max = Math.max(...stats.dailyLogins.map(x => x.logins), 1)
                        return (
                          <tr key={d.day} className={cn("border-b", darkMode ? "border-white/5" : "border-slate-50")}>
                            <td className={cn("py-2 pr-4", darkMode ? "text-white/60" : "text-slate-600")}>{formatDayLabel(d.day)}</td>
                            <td className={cn("py-2 pr-4 font-semibold", darkMode ? "text-white" : "text-slate-800")}>{d.logins}</td>
                            <td className="py-2 w-full">
                              <div className={cn("rounded-full h-1.5 overflow-hidden", darkMode ? "bg-white/10" : "bg-slate-100")}>
                                <div className="h-full bg-primary rounded-full" style={{ width: `${(d.logins / max) * 100}%` }} />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal: Gerenciar usuário ── */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={cn("w-full max-w-lg rounded-2xl border shadow-2xl", darkMode ? "bg-[#111118] border-white/10" : "bg-white border-slate-200")}>
              {/* Header */}
              <div className={cn("flex items-center justify-between p-5 border-b", darkMode ? "border-white/10" : "border-slate-100")}>
                <div className="flex items-center gap-3">
                  <div className={cn("size-9 rounded-full flex items-center justify-center font-bold", darkMode ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary")}>
                    {(editingUser.profileName || editingUser.userName).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={cn("font-semibold text-sm", darkMode ? "text-white" : "text-slate-800")}>{editingUser.profileName || editingUser.userName}</p>
                    <p className={cn("text-xs", darkMode ? "text-white/40" : "text-slate-400")}>{editingUser.profileEmail || editingUser.userEmail}</p>
                  </div>
                </div>
                <button onClick={() => { setEditingUser(null); setResetLink(null) }} className={cn("p-1 rounded-lg", darkMode ? "hover:bg-white/10 text-white/50" : "hover:bg-slate-100 text-slate-400")}>
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Editar dados */}
                <div>
                  <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", darkMode ? "text-white/40" : "text-slate-400")}>Dados da conta</p>
                  <div className="space-y-3">
                    <div>
                      <label className={cn("text-xs mb-1 block", darkMode ? "text-white/60" : "text-slate-500")}>Nome</label>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className={cn("w-full rounded-lg px-3 py-2 text-sm focus:outline-none", darkMode ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border border-slate-200 text-slate-800")} />
                    </div>
                    <div>
                      <label className={cn("text-xs mb-1 block", darkMode ? "text-white/60" : "text-slate-500")}>E-mail</label>
                      <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        className={cn("w-full rounded-lg px-3 py-2 text-sm focus:outline-none", darkMode ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border border-slate-200 text-slate-800")} />
                    </div>
                    <div>
                      <label className={cn("text-xs mb-1 block", darkMode ? "text-white/60" : "text-slate-500")}>Vencimento de acesso</label>
                      <input type="date" value={editForm.accessExpiresAt} onChange={e => setEditForm(f => ({ ...f, accessExpiresAt: e.target.value }))}
                        className={cn("w-full rounded-lg px-3 py-2 text-sm focus:outline-none", darkMode ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border border-slate-200 text-slate-800")} />
                    </div>
                    <button onClick={handleSaveEdit} disabled={isPending} className="w-full bg-primary hover:bg-primary/90 text-white text-sm py-2 rounded-lg transition-colors disabled:opacity-60">
                      {isPending ? "Salvando..." : "Salvar alterações"}
                    </button>
                  </div>
                </div>

                <div className={cn("border-t", darkMode ? "border-white/10" : "border-slate-100")} />

                {/* Estender licença */}
                <div>
                  <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", darkMode ? "text-white/40" : "text-slate-400")}>Estender licença</p>
                  <div className="flex gap-2">
                    <input type="number" min={1} max={3650} value={extendDays} onChange={e => setExtendDays(Number(e.target.value))}
                      className={cn("w-24 rounded-lg px-3 py-2 text-sm focus:outline-none", darkMode ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border border-slate-200 text-slate-800")} />
                    <span className={cn("flex items-center text-sm", darkMode ? "text-white/50" : "text-slate-500")}>dias</span>
                    <button onClick={handleExtendLicense} disabled={isPending} className="flex-1 bg-emerald-600/80 hover:bg-emerald-600 text-white text-sm py-2 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
                      <PlusCircle className="size-4" />Adicionar dias
                    </button>
                  </div>
                </div>

                <div className={cn("border-t", darkMode ? "border-white/10" : "border-slate-100")} />

                {/* Reset senha */}
                <div>
                  <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", darkMode ? "text-white/40" : "text-slate-400")}>Segurança</p>
                  <button onClick={handleSendReset} disabled={isPending} className={cn(
                    "w-full flex items-center justify-center gap-2 text-sm py-2 rounded-lg border transition-colors disabled:opacity-60",
                    darkMode ? "border-white/10 text-white/60 hover:bg-white/5 hover:text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}>
                    <KeyRound className="size-4" />Gerar link de redefinir senha
                  </button>
                  {resetLink && (
                    <div className={cn("mt-2 rounded-lg p-3 text-xs break-all", darkMode ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border border-emerald-200 text-emerald-700")}>
                      <p className="font-medium mb-1">Link gerado (válido por 1 hora):</p>
                      <p className="font-mono break-all">{`${process.env.NEXT_PUBLIC_APP_URL ?? ""}${resetLink}`}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}${resetLink}`); toast.success("Link copiado!") }}
                        className="mt-2 text-xs underline"
                      >Copiar link</button>
                    </div>
                  )}
                </div>

                <div className={cn("border-t", darkMode ? "border-white/10" : "border-slate-100")} />

                {/* Zona perigosa */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-red-400">Zona perigosa</p>
                  <button onClick={handleRevokeAccess} disabled={isPending} className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60">
                    <Ban className="size-4" />Revogar acesso imediatamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Pagamentos ── */}
        {tab === "pagamentos" && (
          <div className="space-y-4">
            {/* Cards de receita */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Receita hoje", value: stats.revenueStats.dayCents, color: "text-cyan-400" },
                { label: "Receita na semana", value: stats.revenueStats.weekCents, color: "text-blue-400" },
                { label: "Receita no mês", value: stats.revenueStats.monthCents, color: "text-indigo-400" },
                { label: "Receita total", value: stats.revenueStats.totalCents, color: "text-emerald-400" },
              ].map(item => (
                <div key={item.label} className={cn("rounded-xl border p-4", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                  <p className={cn("text-xl font-bold", item.color)}>
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.value / 100)}
                  </p>
                  <p className={cn("text-xs mt-1", darkMode ? "text-white/40" : "text-slate-400")}>{item.label}</p>
                </div>
              ))}
            </div>

            {/* Tabela de pagamentos */}
            <div className={cn("rounded-2xl border overflow-hidden", darkMode ? "bg-[#0f0f16] border-white/8" : "bg-white border-slate-200")}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 gap-3 flex-wrap">
                <h2 className={cn("text-sm font-semibold", darkMode ? "text-white/70" : "text-slate-600")}>
                  Histórico de pagamentos
                  <span className={cn("ml-2 text-xs font-normal", darkMode ? "text-white/30" : "text-slate-400")}>via Mercado Pago · PIX</span>
                </h2>
                <div className="flex gap-1.5 flex-wrap">
                  {(["todos", "approved", "pending", "rejected"] as const).map(f => (
                    <button key={f} onClick={() => setPaymentFilter(f)}
                      className={cn("px-3 py-1 rounded-full text-xs transition-colors",
                        paymentFilter === f
                          ? "bg-primary text-white"
                          : darkMode ? "bg-white/6 text-white/50 hover:bg-white/10" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}>
                      {f === "todos" ? "Todos" : f === "approved" ? "Aprovados" : f === "pending" ? "Pendentes" : "Rejeitados"}
                    </button>
                  ))}
                  <button onClick={loadPayments} disabled={paymentsLoading}
                    className={cn("px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1",
                      darkMode ? "bg-white/6 text-white/50 hover:bg-white/10" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}>
                    <RefreshCw className={cn("size-3", paymentsLoading && "animate-spin")} />Atualizar
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn("text-xs border-b", darkMode ? "text-white/40 border-white/10 bg-white/3" : "text-slate-400 border-slate-100 bg-slate-50")}>
                      <th className="text-left px-4 py-3 font-medium">Usuário</th>
                      <th className="text-left px-4 py-3 font-medium">Plano</th>
                      <th className="text-left px-4 py-3 font-medium">Valor</th>
                      <th className="text-left px-4 py-3 font-medium">Método</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Data pagamento</th>
                      <th className="text-left px-4 py-3 font-medium">ID Mercado Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsLoading ? (
                      <tr><td colSpan={7} className={cn("text-center py-10 text-sm", darkMode ? "text-white/30" : "text-slate-400")}>Carregando...</td></tr>
                    ) : paymentsList.filter(p => paymentFilter === "todos" || p.status === paymentFilter).length === 0 ? (
                      <tr><td colSpan={7} className={cn("text-center py-10 text-sm", darkMode ? "text-white/30" : "text-slate-400")}>Nenhum pagamento encontrado.</td></tr>
                    ) : paymentsList
                      .filter(p => paymentFilter === "todos" || p.status === paymentFilter)
                      .map(p => (
                        <tr key={p.id} className={cn("border-b transition-colors", darkMode ? "border-white/5 hover:bg-white/3" : "border-slate-50 hover:bg-slate-50")}>
                          <td className="px-4 py-3">
                            <p className={cn("text-sm font-medium", darkMode ? "text-white/90" : "text-slate-800")}>{p.userName ?? "—"}</p>
                            <p className={cn("text-xs", darkMode ? "text-white/40" : "text-slate-400")}>{p.userEmail ?? "—"}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{p.planName}</span>
                            <p className={cn("text-[10px] mt-0.5", darkMode ? "text-white/30" : "text-slate-400")}>{p.durationDays}d</p>
                          </td>
                          <td className={cn("px-4 py-3 font-semibold", darkMode ? "text-emerald-400" : "text-emerald-600")}>
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.amountCents / 100)}
                          </td>
                          <td className={cn("px-4 py-3 text-xs uppercase", darkMode ? "text-white/50" : "text-slate-500")}>
                            {p.paymentMethod}
                          </td>
                          <td className="px-4 py-3">
                            {p.status === "approved" ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="size-3.5" />Aprovado</span>
                            ) : p.status === "pending" ? (
                              <span className="flex items-center gap-1 text-xs text-amber-400"><Clock className="size-3.5" />Pendente</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="size-3.5" />Rejeitado</span>
                            )}
                          </td>
                          <td className={cn("px-4 py-3 text-xs", darkMode ? "text-white/50" : "text-slate-400")}>
                            {formatDateTime(p.paidAt ?? p.createdAt)}
                          </td>
                          <td className={cn("px-4 py-3 text-xs font-mono", darkMode ? "text-white/30" : "text-slate-400")}>
                            {p.mpPaymentId}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

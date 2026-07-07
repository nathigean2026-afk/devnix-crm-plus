"use client"
// v4 - tabs extracted final

import { useState, useTransition, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { PromoCode } from "@/lib/db/schema"
import {
  adminCreatePromoCode, adminDeletePromoCode,
  adminUpdateUser, adminSendPasswordReset, adminExtendLicense, adminRevokeAccess,
  adminDeleteUser,
  adminGetPayments,
  adminSendDirectMessage,
  adminSaveSaasConfig,
  adminGetPatchNotes, adminCreatePatchNote, adminUpdatePatchNote, adminDeletePatchNote,
  adminChangePlan,
  adminClearUsedCodes,
  adminGetLogs,
} from "@/lib/actions"
import type { PatchNote } from "@/lib/db/schema"
import { AdminTickets } from "@/components/admin/admin-tickets"
import { StatCard } from "@/components/admin/stat-card"
import { AdminWhatsappTab } from "@/components/admin/admin-whatsapp-tab"
import { AdminPushTab } from "@/components/admin/admin-push-tab"
import { AdminAtualizacoesTab } from "@/components/admin/admin-atualizacoes-tab"
import { toast } from "sonner"
import Image from "next/image"
import {
  UsersRound, ShieldCheck, Tag, BarChart3, LogOut, Plus, Trash2,
  CheckCircle2, XCircle, Clock, RefreshCw, LifeBuoy, Wifi, WifiOff,
  Sun, Moon, TrendingUp, Database, Zap, AlertTriangle, Eye, Edit2,
  KeyRound, Ban, PlusCircle, ChevronDown, ChevronUp, Activity,
  DollarSign, Calendar, Globe, Monitor, Filter, Search, X, Send, Megaphone, Pencil,
  MessageCircle, Smartphone, QrCode, FlaskConical, Link2Off, Link2,
  Bell, Users2, Radio, History, ClipboardList, ShieldAlert,
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

// Usa getters UTC diretamente — sem Intl/toLocaleString que pode divergir
// entre Node.js (servidor) e browser (cliente) causando hydration mismatch.
function pad(n: number) { return String(n).padStart(2, "0") }

function formatDate(d: Date | string | null) {
  if (!d) return "—"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return "—"
  return `${pad(dt.getUTCDate())}/${pad(dt.getUTCMonth() + 1)}/${dt.getUTCFullYear()}`
}

function formatDateTime(d: Date | string | null) {
  if (!d) return "—"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return "—"
  return `${pad(dt.getUTCDate())}/${pad(dt.getUTCMonth() + 1)}, ${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`
}

function formatDayLabel(d: string) {
  // d vem como "YYYY-MM-DD" via TO_CHAR no Postgres — extrai por split, sem Date()
  const parts = String(d).slice(0, 10).split("-")
  if (parts.length !== 3) return d
  return `${parts[2]}/${parts[1]}`
}

/** Retorna quantos dias inteiros restam (pode ser 0 se menos de 1 dia, mas ainda ativo). */
function daysLeft(d: Date | string | null) {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

/** Verifica se a licença está realmente ativa comparando o timestamp diretamente. */
function isLicenseActive(d: Date | string | null): boolean {
  if (!d) return false
  return new Date(d).getTime() > Date.now()
}

/** Retorna label legível do tempo restante: "45min", "3h", "5d", etc. */
function timeLeftLabel(d: Date | string | null): string {
  if (!d) return ""
  const ms = new Date(d).getTime() - Date.now()
  if (ms <= 0) return ""
  const totalMin = Math.floor(ms / 60000)
  if (totalMin < 60) return `${totalMin}min`
  const hours = Math.floor(totalMin / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  const remH = hours % 24
  return remH > 0 ? `${days}d ${remH}h` : `${days}d`
}

/** Converte minutos em label legível: "30min", "1h", "2d 3h", "30d" */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  const rem = h % 24
  return rem > 0 ? `${d}d ${rem}h` : `${d}d`
}

function parseIp(ip: string | null) {
  if (!ip) return "—"
  const clean = ip.replace(/^::ffff:/, "")
  if (clean === "::1" || clean === "127.0.0.1") return "Localhost"
  return clean
}

type Tab = "visao" | "licencas" | "usuarios" | "codigos" | "suporte" | "metricas" | "pagamentos" | "configuracoes" | "atualizacoes" | "whatsapp" | "push" | "logs"

type AdminLogRow = { id: string; adminEmail: string; action: string; description: string; targetUserId: string | null; targetUserEmail: string | null; meta: string | null; createdAt: Date }

export default function AdminDashboard({
  stats: initialStats, codes, tickets, initialSaasConfig, initialLogs = [],
}: {
  stats: StatsData; codes: PromoCode[]; tickets: TicketRow[]
  initialSaasConfig?: { maintenanceMode: boolean; supportEmail: string; maxClientsStarter: number; maxClientsProf: number; maxOsStarter: number; trialDays: number }
  initialLogs?: AdminLogRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tab, setTab] = useState<Tab>("visao")
  const [darkMode, setDarkMode] = useState(true)
  const [promoForm, setPromoForm] = useState({ code: "", planName: "Starter", days: 30, hours: 0, expiresAt: "" })
  const [showForm, setShowForm] = useState(false)
  const [localCodes, setLocalCodes] = useState(codes)
  // Sincroniza localCodes quando o servidor devolve dados novos após router.refresh()
  useEffect(() => { setLocalCodes(codes) }, [codes])
  const [stats, setStats] = useState(initialStats)
  const [logs, setLogs] = useState<AdminLogRow[]>(initialLogs)
  const [logFilter, setLogFilter] = useState<string>("todos")
  const [userSearch, setUserSearch] = useState("")
  const [userFilter, setUserFilter] = useState<"todos" | "ativos" | "expirados" | "online">("todos")
  const [editingUser, setEditingUser] = useState<LicenseRow | null>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "", accessExpiresAt: "" })
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "business" | "enterprise">("starter")
  const [extendDays, setExtendDays] = useState(30)
  const [resetLink, setResetLink] = useState<string | null>(null)
  const [geoData, setGeoData] = useState<Record<string, GeoInfo>>({})
  const [geoLoading, setGeoLoading] = useState(false)
  const [paymentsList, setPaymentsList] = useState<PaymentRow[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentFilter, setPaymentFilter] = useState<"todos" | "approved" | "pending" | "rejected">("todos")
  const [codigoFilter, setCodigoFilter] = useState<"todos" | "disponivel" | "usado" | "expirado">("todos")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saasConfig, setSaasConfig] = useState({
    maintenanceMode: initialSaasConfig?.maintenanceMode ?? false,
    supportEmail: initialSaasConfig?.supportEmail ?? "suporte@elevanthe.com.br",
    maxClientsStarter: initialSaasConfig?.maxClientsStarter ?? 50,
    maxClientsProf: initialSaasConfig?.maxClientsProf ?? 300,
    maxOsStarter: initialSaasConfig?.maxOsStarter ?? 100,
    trialDays: initialSaasConfig?.trialDays ?? 0,
  })
  const [unlimitedFlags, setUnlimitedFlags] = useState({
    maxClientsStarter: false,
    maxClientsProf: false,
    maxOsStarter: false,
  })
  const [configSaved, setConfigSaved] = useState(false)
  const [broadcastUser, setBroadcastUser] = useState<LicenseRow | null>(null)
  const [broadcastMessage, setBroadcastMessage] = useState("")

  // ── Z-API / WhatsApp ──
  type ZapiStatus = { connected: boolean; smartphoneConnected?: boolean; session?: string; error?: string } | null
  const [zapiStatus, setZapiStatus] = useState<ZapiStatus>(null)
  const [zapiLoading, setZapiLoading] = useState(false)
  const [zapiQr, setZapiQr] = useState<string | null>(null)
  const [zapiQrLoading, setZapiQrLoading] = useState(false)
  const [zapiTestPhone, setZapiTestPhone] = useState("")
  const [zapiTestLoading, setZapiTestLoading] = useState(false)
  const [zapiTestResult, setZapiTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function loadZapiStatus() {
    setZapiLoading(true)
    setZapiQr(null)
    try {
      const res = await fetch("/api/admin/zapi/status", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) {
        setZapiStatus({ connected: false, error: json.error ?? "Erro desconhecido" })
      } else {
        // Z-API retorna { connected: boolean, smartphoneConnected: boolean, session: string }
        const d = json.data ?? {}
        setZapiStatus({
          connected: d.connected ?? false,
          smartphoneConnected: d.smartphoneConnected,
          session: d.session,
        })
        // Se não conectado, busca QR automaticamente
        if (!d.connected) loadZapiQr()
      }
    } catch {
      setZapiStatus({ connected: false, error: "Falha ao conectar com a Z-API" })
    } finally {
      setZapiLoading(false)
    }
  }

  async function loadZapiQr() {
    setZapiQrLoading(true)
    try {
      const res = await fetch("/api/admin/zapi/qrcode", { cache: "no-store" })
      const json = await res.json()
      // Z-API retorna { value: "data:image/png;base64,..." }
      const qr = json.data?.value ?? json.data?.qrCode ?? null
      setZapiQr(qr)
    } catch {
      setZapiQr(null)
    } finally {
      setZapiQrLoading(false)
    }
  }

  async function handleZapiDisconnect() {
    if (!confirm("Deseja desconectar o WhatsApp desta instância?")) return
    await fetch("/api/admin/zapi/disconnect", { method: "POST" })
    await loadZapiStatus()
  }

  async function handleZapiTest() {
    if (!zapiTestPhone.trim()) return
    setZapiTestLoading(true)
    setZapiTestResult(null)
    try {
      const res = await fetch("/api/admin/zapi/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: zapiTestPhone }),
      })
      const json = await res.json()
      if (res.ok && json.status === 200) {
        setZapiTestResult({ ok: true, msg: "Mensagem enviada com sucesso! Verifique o WhatsApp." })
      } else {
        setZapiTestResult({ ok: false, msg: json.data?.message ?? json.error ?? "Falha ao enviar. Verifique se o número está correto e a instância está conectada." })
      }
    } catch {
      setZapiTestResult({ ok: false, msg: "Erro de conexão com a Z-API." })
    } finally {
      setZapiTestLoading(false)
    }
  }

  // ── Push Notifications ──
  type PushNotifRow = { id: string; title: string; body: string; url: string; type: string; sentBy: string; totalSent: number; totalFailed: number; createdAt: string }
  const [pushStats, setPushStats] = useState<{ totalSubscribers: number; notifications: PushNotifRow[] } | null>(null)
  const [pushStatsLoading, setPushStatsLoading] = useState(false)
  const [pushTitle, setPushTitle] = useState("")
  const [pushBody, setPushBody] = useState("")
  const [pushUrl, setPushUrl] = useState("/dashboard")
  const [pushType, setPushType] = useState<"info" | "warning" | "promo" | "maintenance">("info")
  const [pushRecipient, setPushRecipient] = useState<"all" | "active">("all")
  const [pushSending, setPushSending] = useState(false)
  const [pushResult, setPushResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function loadPushStats() {
    setPushStatsLoading(true)
    try {
      const res = await fetch("/api/admin/push/stats", { cache: "no-store", credentials: "include" })
      const json = await res.json()
      if (res.ok) setPushStats(json)
    } catch { /* silencioso */ }
    finally { setPushStatsLoading(false) }
  }

  async function handleSendPush() {
    if (!pushTitle.trim() || !pushBody.trim()) return
    setPushSending(true)
    setPushResult(null)
    try {
      const res = await fetch("/api/admin/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: pushTitle, body: pushBody, url: pushUrl, type: pushType, recipient: pushRecipient }),
      })
      const json = await res.json()
      if (res.ok) {
        const msg = json.warning
          ? json.warning
          : `Enviado para ${json.totalSent} dispositivo(s).${json.totalFailed > 0 ? ` ${json.totalFailed} falhou(aram).` : ""}`
        setPushResult({ ok: json.totalSent > 0 || !json.warning, message: msg })
        setPushTitle("")
        setPushBody("")
        setPushUrl("/dashboard")
        setPushType("info")
        await loadPushStats()
      } else {
        setPushResult({ ok: false, message: json.error ?? "Erro ao enviar notificações." })
      }
    } catch {
      setPushResult({ ok: false, message: "Erro de conexão." })
    } finally {
      setPushSending(false)
    }
  }

  // ── Patch Notes ──
  const [patchNotesList, setPatchNotesList] = useState<PatchNote[]>([])
  const [patchNotesLoaded, setPatchNotesLoaded] = useState(false)
  const [patchForm, setPatchForm] = useState({ version: "", title: "", body: "", type: "feature", published: true })
  const [patchFormOpen, setPatchFormOpen] = useState(false)
  const [editingPatchId, setEditingPatchId] = useState<string | null>(null)
  const [patchSaving, setPatchSaving] = useState(false)

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

  function handleDeleteUser() {
    if (!editingUser) return
    const deletedId = editingUser.userId
    startTransition(async () => {
      try {
        await adminDeleteUser(deletedId)
        // Remove o usuário da lista local imediatamente, sem precisar de F5
        setStats(prev => ({
          ...prev,
          licenseData: prev.licenseData.filter(u => u.userId !== deletedId),
          totalUsers: prev.totalUsers - 1,
          onlineSessions: prev.onlineSessions.filter(s => s.userId !== deletedId),
        }))
        setEditingUser(null)
        setConfirmDelete(false)
        toast.success("Usuário excluído com sucesso.")
        router.refresh()
      } catch {
        toast.error("Erro ao excluir usuário.")
      }
    })
  }

  async function handleCreateCode(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        // Calcula duração em minutos com precisão total (sem arredondamento)
        const durationMinutes = promoForm.days * 1440 + promoForm.hours * 60
        await adminCreatePromoCode({ code: promoForm.code, planName: promoForm.planName, durationMinutes, expiresAt: promoForm.expiresAt || undefined })
        toast.success(`Código ${promoForm.code.toUpperCase()} criado! (${formatDuration(durationMinutes)})`)
        setPromoForm({ code: "", planName: "Starter", days: 30, hours: 0, expiresAt: "" })
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
    setConfirmDelete(false)
    setEditForm({
      name: u.profileName || u.userName,
      email: u.profileEmail || u.userEmail,
      accessExpiresAt: u.accessExpiresAt ? new Date(u.accessExpiresAt).toISOString().split("T")[0] : "",
    })
    const plan = (u.licensePlan ?? "starter").toLowerCase()
    setSelectedPlan(plan === "business" ? "business" : plan === "enterprise" ? "enterprise" : "starter")
  }

  async function handleChangePlan(plan: "starter" | "business" | "enterprise") {
    if (!editingUser) return
    startTransition(async () => {
      try {
        await adminChangePlan(editingUser.userId, plan)
        setSelectedPlan(plan)
        toast.success(`Plano alterado para ${plan.charAt(0).toUpperCase() + plan.slice(1)}`)
      } catch {
        toast.error("Erro ao alterar plano")
      }
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
      userFilter === "ativos" ? isLicenseActive(u.accessExpiresAt) :
      userFilter === "expirados" ? (u.accessExpiresAt !== null && !isLicenseActive(u.accessExpiresAt)) :
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
    if (t === "whatsapp" && zapiStatus === null) {
      loadZapiStatus()
    }
    if (t === "push" && pushStats === null) {
      loadPushStats()
    }
    if (t === "atualizacoes" && !patchNotesLoaded) {
      adminGetPatchNotes().then(list => {
        setPatchNotesList(list)
        setPatchNotesLoaded(true)
      })
    }
  }

  function exportUsersCSV() {
    const header = "Nome,E-mail,Plano,Cadastro,Vencimento,Ultimo Acesso,IP,Status"
    const rows = stats.licenseData.map(u => {
      const days = daysLeft(u.accessExpiresAt)
      const active = isLicenseActive(u.accessExpiresAt)
      const status = active ? `Ativo (${timeLeftLabel(u.accessExpiresAt)})` : u.accessExpiresAt ? "Expirado" : "Sem licença"
      return [
        `"${u.profileName || u.userName}"`,
        `"${u.profileEmail || u.userEmail}"`,
        u.licensePlan ?? "starter",
        formatDate(u.userCreatedAt),
        formatDate(u.accessExpiresAt),
        formatDateTime(u.lastSessionAt),
        parseIp(u.lastSessionIp),
        status,
      ].join(",")
    })
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `usuarios-elevanthe-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSendBroadcast() {
    if (!broadcastUser || !broadcastMessage.trim()) return
    startTransition(async () => {
      try {
        await adminSendDirectMessage(broadcastUser.userId, broadcastMessage)
        toast.success(`Mensagem enviada para ${broadcastUser.profileName || broadcastUser.userName}`)
        setBroadcastUser(null)
        setBroadcastMessage("")
      } catch {
        toast.error("Erro ao enviar mensagem direta. Use a aba Suporte.")
      }
    })
  }

  function saveConfig() {
    setConfigSaved(true)
    startTransition(async () => {
      try {
        await adminSaveSaasConfig(saasConfig)
        toast.success("Configurações salvas com sucesso.")
      } catch {
        toast.error("Erro ao salvar configurações.")
      } finally {
        setConfigSaved(false)
      }
    })
  }

  // Usuários expirando nos próximos 7 dias (mas ainda ativos)
  const expiringUsers = stats.licenseData.filter(u => {
    const d = daysLeft(u.accessExpiresAt)
    return isLicenseActive(u.accessExpiresAt) && d !== null && d <= 7
  })

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "visao", label: "Visão Geral", icon: BarChart3 },
    { key: "licencas", label: "Licenças", icon: ShieldCheck },
    { key: "usuarios", label: "Usuários", icon: UsersRound },
    { key: "codigos", label: "Códigos", icon: Tag },
    { key: "suporte", label: `Suporte (${tickets.filter(t => t.status === "aberto" || t.status === "em_andamento").length})`, icon: LifeBuoy },
    { key: "metricas", label: "Métricas", icon: Activity },
    { key: "pagamentos", label: "Pagamentos", icon: DollarSign },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { key: "push", label: "Push", icon: Bell },
    { key: "atualizacoes", label: "Atualizações", icon: Megaphone },
    { key: "configuracoes", label: "Configurações", icon: Globe },
    { key: "logs", label: "Logs", icon: ClipboardList },
  ]

  return (
    <div className={cn("min-h-screen text-white", darkMode ? "dark bg-[#0a0a0f]" : "bg-slate-50")}>
      <div className={cn(darkMode ? "bg-[#0a0a0f] text-white" : "bg-slate-50 text-slate-900")}>
        {/* Header */}
        <header className={cn(
          "border-b px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur",
          darkMode ? "border-white/8 bg-[#0a0a0f]/90" : "border-slate-200 bg-white/90"
        )}>
          <div className="flex items-center gap-3">
            <Image
              src="/elevanthe-icon.png"
              alt="Elevanthe"
              width={32}
              height={32}
              className={cn("rounded-lg object-contain shrink-0", darkMode ? "opacity-90" : "opacity-100")}
            />
            <div>
              <h1 className={cn("font-bold text-sm leading-none", darkMode ? "text-white" : "text-slate-900")}>Elevanthe CRM</h1>
              <p className={cn("text-[11px] mt-0.5", darkMode ? "text-white/40" : "text-slate-500")}>Painel de Controle</p>
            </div>
            <div className={cn("hidden sm:block w-px h-5 mx-1", darkMode ? "bg-white/10" : "bg-slate-200")} />
            <span className={cn("hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full", darkMode ? "text-emerald-400 bg-emerald-500/10" : "text-emerald-600 bg-emerald-50")}>
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsRefreshing(true); router.refresh(); setTimeout(() => setIsRefreshing(false), 1000) }}
              disabled={isRefreshing}
              className={cn(
                "flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-colors",
                darkMode ? "text-white/50 border-white/10 hover:border-white/20 hover:text-white/80" : "text-slate-500 border-slate-200 hover:border-slate-300",
                isRefreshing && "opacity-60 cursor-not-allowed"
              )}
              title="Atualizar dados"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
            </button>
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
                darkMode ? "text-white/50 border-white/10 hover:border-red-500/30 hover:text-red-400" : "text-slate-500 border-slate-200 hover:text-red-500 hover:border-red-200"
              )}
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          {/* Stats Cards */}
          <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
            <StatCard darkMode={darkMode} icon={UsersRound} label="Total usuários" value={stats.totalUsers} color="bg-blue-500/80" onClick={() => { handleTabChange("usuarios"); setUserFilter("todos") }} active={tab === "usuarios" && userFilter === "todos"} />
            <StatCard darkMode={darkMode} icon={CheckCircle2} label="Licenças ativas" value={stats.activeUsers} color="bg-emerald-500/80" onClick={() => { handleTabChange("usuarios"); setUserFilter("ativos") }} active={tab === "usuarios" && userFilter === "ativos"} />
            <StatCard darkMode={darkMode} icon={XCircle} label="Contas expiradas" value={stats.expiredUsers} color="bg-red-500/80" onClick={() => { handleTabChange("usuarios"); setUserFilter("expirados") }} active={tab === "usuarios" && userFilter === "expirados"} />
            <StatCard darkMode={darkMode} icon={Wifi} label="Online agora" value={stats.onlineSessions.length} sub="últimos 15 min" color="bg-cyan-500/80" onClick={() => { handleTabChange("usuarios"); setUserFilter("online") }} active={tab === "usuarios" && userFilter === "online"} />
            <StatCard darkMode={darkMode} icon={LifeBuoy} label="Tickets abertos" value={stats.openTickets} color="bg-amber-500/80" onClick={() => handleTabChange("suporte")} active={tab === "suporte"} />
            <StatCard darkMode={darkMode} icon={DollarSign} label="Receita total" value={`R$ ${(stats.revenueStats.totalCents / 100).toFixed(2)}`} sub={`${stats.revenueStats.totalCount} pagamentos aprovados`} color="bg-emerald-600/80" onClick={() => handleTabChange("pagamentos")} active={tab === "pagamentos"} />
            <StatCard darkMode={darkMode} icon={Tag} label="Códigos usados" value={`${stats.usedCodes}/${stats.totalCodes}`} color="bg-purple-500/80" onClick={() => handleTabChange("codigos")} active={tab === "codigos"} />
          </div>

          {/* Tabs */}
          <div className="mb-6 w-full overflow-x-auto">
            <div className={cn(
              "inline-flex gap-0.5 rounded-xl p-1 border min-w-full",
              darkMode ? "bg-white/3 border-white/8" : "bg-slate-100/80 border-slate-200"
            )}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 text-xs px-2 py-2 rounded-lg font-medium whitespace-nowrap transition-all",
                    tab === t.key
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : darkMode ? "text-white/40 hover:text-white/75 hover:bg-white/5" : "text-slate-500 hover:text-slate-700 hover:bg-white"
                  )}
                >
                  <t.icon className="size-3.5 shrink-0" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab: Visão Geral ─�� */}
          {tab === "visao" && (
            <div className="space-y-4">
              {/* Alertas de churn — expirando em breve */}
              {expiringUsers.length > 0 && (
                <div className={cn("rounded-xl border p-4", darkMode ? "bg-amber-500/8 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="size-4 text-amber-400 shrink-0" />
                    <p className={cn("text-sm font-semibold", darkMode ? "text-amber-300" : "text-amber-700")}>
                      {expiringUsers.length} conta{expiringUsers.length > 1 ? "s" : ""} expira{expiringUsers.length > 1 ? "m" : ""} nos próximos 7 dias
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {expiringUsers.slice(0, 5).map(u => (
                      <div key={u.userId} className={cn("flex items-center justify-between rounded-lg p-2.5 gap-3", darkMode ? "bg-white/4" : "bg-white")}>
                        <div className="min-w-0">
                          <p className={cn("text-sm font-medium truncate", darkMode ? "text-white" : "text-slate-800")}>{u.profileName || u.userName}</p>
                          <p className={cn("text-xs", darkMode ? "text-white/50" : "text-slate-400")}>{u.profileEmail || u.userEmail}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-amber-400 font-bold">{timeLeftLabel(u.accessExpiresAt)}</span>
                          <button
                            onClick={() => { openEditUser(u); setTab("usuarios") }}
                            className="text-xs bg-primary/20 hover:bg-primary/40 text-primary px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Renovar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini gráfico de logins */}
              <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="size-4 text-primary" />
                  <h2 className={cn("text-sm font-semibold", darkMode ? "text-white/70" : "text-slate-600")}>Logins diários — últimos 14 dias</h2>
                </div>
                {stats.dailyLogins.length === 0 ? (
                  <div className="h-28 flex items-center justify-center">
                    <p className={cn("text-xs", darkMode ? "text-white/30" : "text-slate-400")}>Sem dados suficientes.</p>
                  </div>
                ) : (
                  <div className="flex items-end gap-1.5 h-28 pt-2">
                    {stats.dailyLogins.map((d) => {
                      const max = Math.max(...stats.dailyLogins.map(x => x.logins), 1)
                      const h = Math.max((d.logins / max) * 100, 4)
                      return (
                        <div key={d.day} className="flex flex-col items-center gap-1 flex-1 group" title={`${d.day}: ${d.logins} login(s)`}>
                          <span className={cn("text-[9px] opacity-0 group-hover:opacity-100 transition-opacity font-bold", darkMode ? "text-white/70" : "text-slate-500")}>
                            {d.logins}
                          </span>
                          <div
                            style={{ height: `${h}%` }}
                            className="w-full rounded-md bg-primary/40 group-hover:bg-primary transition-all duration-200 min-h-[4px]"
                          />
                          <span className={cn("text-[9px]", darkMode ? "text-white/20" : "text-slate-400")}>
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
                      const isActive = isLicenseActive(u.accessExpiresAt)
                      const isWarning = isActive && days !== null && days <= 1
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
                                {isWarning ? <Clock className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}{timeLeftLabel(u.accessExpiresAt)}
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
          </div>
          )}

          {/* ── Tab: Licenças ── */}
          {tab === "licencas" && (
            <div className="space-y-4">
              <div className={cn("rounded-xl border overflow-hidden", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn("text-xs border-b", darkMode ? "text-white/40 border-white/10 bg-white/3" : "text-slate-400 border-slate-100 bg-slate-50")}>
                      <th className="text-left px-4 py-3 font-medium">Usuário</th>
                      <th className="text-left px-4 py-3 font-medium">Plano</th>
                      <th className="text-left px-4 py-3 font-medium">Cadastro</th>
                      <th className="text-left px-4 py-3 font-medium">Vencimento</th>
                      <th className="text-left px-4 py-3 font-medium">Tempo restante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.licenseData.length === 0 ? (
                      <tr><td colSpan={5} className={cn("text-center py-10 text-sm", darkMode ? "text-white/30" : "text-slate-400")}>Nenhuma licença encontrada.</td></tr>
                    ) : stats.licenseData.map((u) => {
                      const isActive = isLicenseActive(u.accessExpiresAt)
                      const days = daysLeft(u.accessExpiresAt)
                      const isWarning = isActive && days !== null && days <= 1
                      return (
                        <tr key={u.userId} className={cn("border-b transition-colors", darkMode ? "border-white/5 hover:bg-white/3" : "border-slate-50 hover:bg-slate-50")}>
                          <td className={cn("px-4 py-3 font-medium", darkMode ? "text-white" : "text-slate-800")}>
                            <div>{u.profileName || u.userName}</div>
                            <div className={cn("text-xs", darkMode ? "text-white/40" : "text-slate-400")}>{u.profileEmail || u.userEmail}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize">{u.licensePlan ?? "starter"}</span>
                          </td>
                          <td className={cn("px-4 py-3 text-xs", darkMode ? "text-white/50" : "text-slate-400")}>{formatDate(u.userCreatedAt)}</td>
                          <td className={cn("px-4 py-3 text-xs", darkMode ? "text-white/60" : "text-slate-500")}>{formatDate(u.accessExpiresAt)}</td>
                          <td className="px-4 py-3">
                            {isActive ? (
                              <span className={cn("flex items-center gap-1 text-xs", isWarning ? "text-yellow-400" : "text-emerald-400")}>
                                {isWarning ? <Clock className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                                {timeLeftLabel(u.accessExpiresAt)}
                              </span>
                            ) : u.accessExpiresAt ? (
                              <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="size-3.5" />Expirada</span>
                            ) : (
                              <span className={cn("text-xs", darkMode ? "text-white/30" : "text-slate-400")}>Sem licença</span>
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
              <div className="flex flex-wrap gap-2 items-center">
                {/* Export CSV */}
                <button
                  onClick={exportUsersCSV}
                  className={cn(
                    "flex items-center gap-1.5 text-xs border rounded-lg px-3 py-2 transition-colors shrink-0",
                    darkMode ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "border-emerald-400 text-emerald-600 hover:bg-emerald-50"
                  )}
                >
                  <Monitor className="size-3.5" />
                  Exportar CSV
                </button>
              </div>
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
                        const isActive = isLicenseActive(u.accessExpiresAt)
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
                                return <span>{geo.city}{geo.region ? `, ${geo.region}` : ""}{geo.country ? `, ${geo.country}` : ""}</span>
                              })()}
                            </td>
                            <td className={cn("px-4 py-3 text-xs", darkMode ? "text-white/40" : "text-slate-400")}>
                              {(() => {
                                const geo = u.lastSessionIp ? geoData[u.lastSessionIp] : null
                                return geo?.isp ? <span>{geo.isp}</span> : <span className="opacity-30">—</span>
                              })()}
                            </td>
                            <td className="px-4 py-3">
                              {isActive ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="size-3.5" />{timeLeftLabel(u.accessExpiresAt)}</span>
                              ) : u.accessExpiresAt ? (
                                <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="size-3.5" />Expirada</span>
                              ) : (
                                <span className={cn("text-xs", darkMode ? "text-white/30" : "text-slate-400")}>Sem licença</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  onClick={() => { setBroadcastUser(u); setBroadcastMessage("") }}
                                  className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors border", darkMode ? "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20" : "border-slate-200 text-slate-400 hover:text-slate-700")}
                                  title="Enviar mensagem"
                                >
                                  <Send className="size-3" />
                                </button>
                                <button
                                  onClick={() => openEditUser(u)}
                                  className="inline-flex items-center gap-1 text-xs bg-primary/20 hover:bg-primary/40 text-primary px-2.5 py-1 rounded-lg transition-colors"
                                >
                                  <Edit2 className="size-3" />Gerenciar
                                </button>
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

          {/* ── Tab: Códigos Promo ── */}
          {tab === "codigos" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>Códigos Promocionais</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Filtro por status */}
                  <div className={cn("flex gap-0.5 p-0.5 rounded-lg border", darkMode ? "bg-white/3 border-white/8" : "bg-slate-100 border-slate-200")}>
                    {([
                      { key: "todos", label: "Todos" },
                      { key: "disponivel", label: "Disponíveis" },
                      { key: "usado", label: "Usados" },
                      { key: "expirado", label: "Expirados" },
                    ] as const).map(f => (
                      <button key={f.key} onClick={() => setCodigoFilter(f.key)}
                        className={cn("text-xs px-3 py-1.5 rounded-md transition-colors",
                          codigoFilter === f.key
                            ? "bg-primary text-white"
                            : darkMode ? "text-white/40 hover:text-white/70" : "text-slate-500 hover:text-slate-700"
                        )}>{f.label}</button>
                    ))}
                  </div>
                  {/* Limpar usados */}
                  <button
                    onClick={async () => {
                      if (!confirm("Apagar todos os códigos já utilizados? Esta ação não pode ser desfeita.")) return
                      startTransition(async () => {
                        try {
                          await adminClearUsedCodes()
                          setLocalCodes(prev => prev.filter(c => !c.usedBy))
                          toast.success("Códigos usados removidos")
                        } catch { toast.error("Erro ao limpar códigos") }
                      })
                    }}
                    disabled={isPending}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors",
                      darkMode ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-red-200 text-red-500 hover:bg-red-50"
                    )}
                  >
                    <Trash2 className="size-3.5" />Limpar usados
                  </button>
                  <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
                    <Plus className="size-4" />Novo código
                  </button>
                </div>
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
                      <select
                        value={promoForm.planName}
                        onChange={e => setPromoForm(f => ({ ...f, planName: e.target.value }))}
                        style={darkMode ? { backgroundColor: "#1e1e2e", color: "#fff", borderColor: "rgba(255,255,255,0.12)" } : undefined}
                        className={cn("rounded-lg px-3 py-2 text-sm focus:outline-none border", darkMode ? "border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")}
                      >
                        {PLANS.map(p => (
                          <option key={p} value={p} style={darkMode ? { backgroundColor: "#1e1e2e", color: "#fff" } : undefined}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={cn("text-xs", darkMode ? "text-white/60" : "text-slate-500")}>Duração do acesso</label>
                      <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-0.5">
                          <input type="number" required min={0} max={3650} value={promoForm.days} onChange={e => setPromoForm(f => ({ ...f, days: Number(e.target.value) }))}
                            className={cn("w-full rounded-lg px-3 py-2 text-sm focus:outline-none border", darkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")} />
                          <span className={cn("text-[10px] text-center", darkMode ? "text-white/30" : "text-slate-400")}>dias</span>
                        </div>
                        <div className="flex items-center">
                          <span className={cn("text-sm", darkMode ? "text-white/30" : "text-slate-300")}>+</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-0.5">
                          <input type="number" min={0} max={23} value={promoForm.hours} onChange={e => setPromoForm(f => ({ ...f, hours: Number(e.target.value) }))}
                            className={cn("w-full rounded-lg px-3 py-2 text-sm focus:outline-none border", darkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")} />
                          <span className={cn("text-[10px] text-center", darkMode ? "text-white/30" : "text-slate-400")}>horas</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={cn("text-xs", darkMode ? "text-white/60" : "text-slate-500")}>Expiração do código (opcional)</label>
                      <input type="date" value={promoForm.expiresAt} onChange={e => setPromoForm(f => ({ ...f, expiresAt: e.target.value }))}
                        className={cn("rounded-lg px-3 py-2 text-sm focus:outline-none border", darkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800")} />
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
                      {(() => {
                        const filtered = localCodes.filter(c => {
                          if (codigoFilter === "todos") return true
                          const isExpired = !!(c.expiresAt && new Date(c.expiresAt) < now)
                          if (codigoFilter === "usado") return !!c.usedBy
                          if (codigoFilter === "expirado") return !c.usedBy && isExpired
                          if (codigoFilter === "disponivel") return !c.usedBy && !isExpired
                          return true
                        })
                        if (filtered.length === 0) return (
                          <tr><td colSpan={8} className={cn("text-center py-8 text-sm", darkMode ? "text-white/30" : "text-slate-400")}>Nenhum código encontrado.</td></tr>
                        )
                        return filtered.map((c) => {
                        const expired = c.expiresAt && new Date(c.expiresAt) < now
                        return (
                          <tr key={c.id} className={cn("border-b transition-colors", darkMode ? "border-white/5 hover:bg-white/3" : "border-slate-50 hover:bg-slate-50")}>
                            <td className={cn("px-4 py-3 font-mono text-xs tracking-wider", darkMode ? "text-white" : "text-slate-800")}>{c.code}</td>
                            <td className="px-4 py-3"><span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{c.planName}</span></td>
                            <td className={cn("px-4 py-3 font-semibold", darkMode ? "text-white/80" : "text-slate-700")}>+{formatDuration(c.durationMinutes ?? c.days * 1440)}</td>
                            <td className={cn("px-4 py-3 text-xs", darkMode ? "text-white/50" : "text-slate-400")}>{c.expiresAt ? formatDate(c.expiresAt) : "—"}</td>
                            <td className={cn("px-4 py-3 text-xs", darkMode ? "text-white/50" : "text-slate-400")}>
                              {c.usedBy ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className={cn("font-medium", darkMode ? "text-white/80" : "text-slate-700")}>{c.usedByName ?? "—"}</span>
                                  <span className={cn(darkMode ? "text-white/40" : "text-slate-400")}>{c.usedByEmail ?? c.usedBy}</span>
                                </div>
                              ) : "—"}
                            </td>
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
                      })
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Suporte ── */}
          {tab === "suporte" && (
            <AdminTickets initialTickets={tickets} darkMode={darkMode} />
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
                  Pagamentos processados via <strong>Mercado Pago</strong> — PIX, cartão de crédito e boleto. Os valores são registrados automaticamente após confirmação do pagamento. Veja o histórico completo na aba Pagamentos.
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
                    {stats.dbMetrics?.latencyMs != null ? `${stats.dbMetrics.latencyMs}ms` : "��"}
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
                    <UsersRound className="size-4 text-cyan-400" />
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
                <button onClick={() => { setEditingUser(null); setResetLink(null); setConfirmDelete(false) }} className={cn("p-1 rounded-lg", darkMode ? "hover:bg-white/10 text-white/50" : "hover:bg-slate-100 text-slate-400")}>
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

                {/* Plano */}
                <div>
                  <p className={cn("text-xs font-semibold uppercase tracking-wider mb-3", darkMode ? "text-white/40" : "text-slate-400")}>Plano da conta</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["starter", "business", "enterprise"] as const).map(plan => {
                      const labels = { starter: "Starter", business: "Business", enterprise: "Enterprise" }
                      const colors = {
                        starter: "border-sky-500/50 bg-sky-500/10 text-sky-400",
                        business: "border-violet-500/50 bg-violet-500/10 text-violet-400",
                        enterprise: "border-amber-500/50 bg-amber-500/10 text-amber-400",
                      }
                      const isActive = selectedPlan === plan
                      return (
                        <button
                          key={plan}
                          onClick={() => handleChangePlan(plan)}
                          disabled={isPending}
                          className={cn(
                            "py-2.5 rounded-lg border text-xs font-semibold transition-all",
                            isActive
                              ? colors[plan]
                              : darkMode
                                ? "border-white/10 text-white/30 hover:border-white/20 hover:text-white/60"
                                : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600",
                            isPending && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {labels[plan]}
                          {isActive && <span className="block text-[10px] mt-0.5 font-normal opacity-70">atual</span>}
                        </button>
                      )
                    })}
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
                        onClick={() => {
                          const text = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}${resetLink}`
                          if (navigator.clipboard?.writeText) {
                            navigator.clipboard.writeText(text).then(() => toast.success("Link copiado!")).catch(() => {
                              const ta = document.createElement("textarea")
                              ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"
                              document.body.appendChild(ta); ta.focus(); ta.select()
                              document.execCommand("copy"); document.body.removeChild(ta)
                              toast.success("Link copiado!")
                            })
                          } else {
                            const ta = document.createElement("textarea")
                            ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"
                            document.body.appendChild(ta); ta.focus(); ta.select()
                            document.execCommand("copy"); document.body.removeChild(ta)
                            toast.success("Link copiado!")
                          }
                        }}
                        className="mt-2 text-xs underline"
                      >Copiar link</button>
                    </div>
                  )}
                </div>

                <div className={cn("border-t", darkMode ? "border-white/10" : "border-slate-100")} />

                {/* Zona perigosa */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-red-400">Zona perigosa</p>
                  <div className="space-y-2">
                    <button onClick={handleRevokeAccess} disabled={isPending} className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60">
                      <Ban className="size-4" />Revogar acesso imediatamente
                    </button>

                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        disabled={isPending}
                        className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-lg border border-red-600/50 bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors disabled:opacity-60"
                      >
                        <Trash2 className="size-4" />Excluir conta permanentemente
                      </button>
                    ) : (
                      <div className={cn("rounded-lg border border-red-500/40 p-3 space-y-2", darkMode ? "bg-red-500/10" : "bg-red-50")}>
                        <p className="text-xs text-red-400 font-medium text-center">Esta ação é irreversível. Todos os dados do usuário serão apagados.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className={cn("flex-1 text-sm py-1.5 rounded-lg border transition-colors", darkMode ? "border-white/10 text-white/50 hover:bg-white/5" : "border-slate-200 text-slate-500 hover:bg-slate-50")}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleDeleteUser}
                            disabled={isPending}
                            className="flex-1 text-sm py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-60"
                          >
                            {isPending ? "Excluindo..." : "Confirmar exclusao"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

          {/* ── Tab: Configurações SaaS ── */}
          {tab === "configuracoes" && (
            <div className="space-y-4">
              {/* Modo manutenção */}
              <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                <h2 className={cn("text-sm font-semibold uppercase tracking-wider mb-4", darkMode ? "text-white/70" : "text-slate-500")}>Sistema</h2>
                <div className="flex flex-col gap-4">
                  <div className={cn("flex items-center justify-between p-4 rounded-lg border", darkMode ? "border-white/8 bg-white/3" : "border-slate-100 bg-slate-50")}>
                    <div>
                      <p className={cn("text-sm font-medium", darkMode ? "text-white" : "text-slate-800")}>Modo Manutenção</p>
                      <p className={cn("text-xs mt-0.5", darkMode ? "text-white/40" : "text-slate-400")}>Bloqueia acesso de novos usuários e exibe aviso de manutenção</p>
                    </div>
                    <button
                      onClick={() => setSaasConfig(c => ({ ...c, maintenanceMode: !c.maintenanceMode }))}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        saasConfig.maintenanceMode ? "bg-red-500" : darkMode ? "bg-white/10" : "bg-slate-200"
                      )}
                    >
                      <span className={cn("inline-block size-4 transform rounded-full bg-white transition-transform shadow", saasConfig.maintenanceMode ? "translate-x-6" : "translate-x-1")} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={cn("text-xs", darkMode ? "text-white/60" : "text-slate-500")}>E-mail de suporte</label>
                    <input
                      value={saasConfig.supportEmail}
                      onChange={e => setSaasConfig(c => ({ ...c, supportEmail: e.target.value }))}
                      className={cn("rounded-lg px-3 py-2 text-sm focus:outline-none", darkMode ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border border-slate-200 text-slate-800")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={cn("text-xs", darkMode ? "text-white/60" : "text-slate-500")}>Dias de trial para novos usuários</label>
                    <input
                      type="number" min={0} max={90}
                      value={saasConfig.trialDays}
                      onChange={e => setSaasConfig(c => ({ ...c, trialDays: Number(e.target.value) }))}
                      className={cn("rounded-lg px-3 py-2 text-sm focus:outline-none w-32", darkMode ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border border-slate-200 text-slate-800")}
                    />
                  </div>
                </div>
              </div>

              {/* Limites por plano */}
              <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                <h2 className={cn("text-sm font-semibold uppercase tracking-wider mb-4", darkMode ? "text-white/70" : "text-slate-500")}>Limites por Plano</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {([
                    { label: "Máx. Clientes — Starter", key: "maxClientsStarter" as const },
                    { label: "Máx. Clientes — Professional", key: "maxClientsProf" as const },
                    { label: "Máx. OS — Starter/mês", key: "maxOsStarter" as const },
                  ] as const).map(item => {
                    const isUnlimited = unlimitedFlags[item.key]
                    return (
                      <div key={item.key} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className={cn("text-xs", darkMode ? "text-white/60" : "text-slate-500")}>{item.label}</label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isUnlimited}
                              onChange={e => setUnlimitedFlags(f => ({ ...f, [item.key]: e.target.checked }))}
                              className="accent-primary size-3.5 rounded"
                            />
                            <span className={cn("text-[11px]", isUnlimited ? "text-primary font-semibold" : darkMode ? "text-white/40" : "text-slate-400")}>
                              Ilimitado
                            </span>
                          </label>
                        </div>
                        <input
                          type="number" min={1}
                          value={saasConfig[item.key]}
                          disabled={isUnlimited}
                          onChange={e => setSaasConfig(c => ({ ...c, [item.key]: Number(e.target.value) }))}
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm focus:outline-none border transition-opacity",
                            isUnlimited ? "opacity-40 cursor-not-allowed" : "",
                            darkMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          )}
                          placeholder={isUnlimited ? "∞ Ilimitado" : ""}
                        />
                        {isUnlimited && (
                          <p className={cn("text-[10px]", darkMode ? "text-primary/60" : "text-primary")}>
                            Sem limite definido — acesso irrestrito
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Resumo de usuários por plano */}
              <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200")}>
                <h2 className={cn("text-sm font-semibold uppercase tracking-wider mb-4", darkMode ? "text-white/70" : "text-slate-500")}>Distribuição de Planos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["starter", "professional", "enterprise"].map(plan => {
                    const cnt = stats.licenseData.filter(u => (u.licensePlan ?? "starter").toLowerCase() === plan).length
                    const pct = stats.licenseData.length > 0 ? Math.round((cnt / stats.licenseData.length) * 100) : 0
                    return (
                      <div key={plan} className={cn("rounded-lg border p-4", darkMode ? "bg-white/3 border-white/8" : "bg-slate-50 border-slate-100")}>
                        <p className="text-xs text-primary uppercase font-bold tracking-wide">{plan}</p>
                        <p className={cn("text-2xl font-bold mt-1", darkMode ? "text-white" : "text-slate-800")}>{cnt}</p>
                        <p className={cn("text-xs mt-0.5", darkMode ? "text-white/40" : "text-slate-400")}>{pct}% dos usuários</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveConfig}
                  className="bg-primary hover:bg-primary/90 text-white text-sm px-6 py-2.5 rounded-lg transition-colors"
                >
                  {configSaved ? "Salvo!" : "Salvar configurações"}
                </button>
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

      {/* Modal: Mensagem direta ao usuário */}
      {broadcastUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={cn("rounded-2xl border w-full max-w-md shadow-2xl", darkMode ? "bg-[#12121a] border-white/10" : "bg-white border-slate-200")}>
            <div className={cn("flex items-center justify-between px-5 py-4 border-b", darkMode ? "border-white/8" : "border-slate-100")}>
              <div>
                <p className={cn("font-semibold text-sm", darkMode ? "text-white" : "text-slate-800")}>Mensagem para {broadcastUser.profileName || broadcastUser.userName}</p>
                <p className={cn("text-xs mt-0.5", darkMode ? "text-white/40" : "text-slate-400")}>{broadcastUser.profileEmail || broadcastUser.userEmail}</p>
              </div>
              <button onClick={() => setBroadcastUser(null)} className={cn("text-xs border rounded-lg px-2.5 py-1.5 transition-colors", darkMode ? "text-white/40 border-white/10 hover:text-white/70" : "text-slate-400 border-slate-200")}>
                Fechar
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <p className={cn("text-xs", darkMode ? "text-white/40" : "text-slate-500")}>
                A mensagem será enviada como uma resposta de suporte para o usuário.
              </p>
              <textarea
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                rows={4}
                placeholder="Digite sua mensagem aqui..."
                className={cn("rounded-lg px-3 py-2 text-sm resize-none focus:outline-none w-full", darkMode ? "bg-white/5 border border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border border-slate-200 text-slate-800")}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setBroadcastUser(null)} className={cn("text-sm px-4 py-2 border rounded-lg transition-colors", darkMode ? "text-white/50 border-white/10 hover:text-white/80" : "text-slate-500 border-slate-200")}>
                  Cancelar
                </button>
                <button
                  onClick={handleSendBroadcast}
                  disabled={!broadcastMessage.trim() || isPending}
                  className="text-sm bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg disabled:opacity-60 flex items-center gap-1.5"
                >
                  <Send className="size-3.5" />
                  {isPending ? "Enviando..." : "Enviar mensagem"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: WhatsApp / Z-API ── */}
      {tab === "whatsapp" && (
        <AdminWhatsappTab
          darkMode={darkMode}
          zapiStatus={zapiStatus}
          zapiLoading={zapiLoading}
          loadZapiStatus={loadZapiStatus}
          handleZapiDisconnect={handleZapiDisconnect}
        />
      )}

      {/* ── Tab: Push Notifications ── */}
      {tab === "push" && (
        <AdminPushTab
          darkMode={darkMode}
          pushStats={pushStats}
          pushStatsLoading={pushStatsLoading}
          loadPushStats={loadPushStats}
          pushTitle={pushTitle}
          setPushTitle={setPushTitle}
          pushBody={pushBody}
          setPushBody={setPushBody}
          pushUrl={pushUrl}
          setPushUrl={setPushUrl}
          pushType={pushType}
          setPushType={setPushType}
          pushRecipient={pushRecipient}
          setPushRecipient={setPushRecipient}
          pushSending={pushSending}
          pushResult={pushResult}
          handleSendPush={handleSendPush}
        />
      )}

      {/* ── Tab: Atualizações ── */}
      {tab === "atualizacoes" && (
        <AdminAtualizacoesTab
          darkMode={darkMode}
          patchNotesList={patchNotesList}
          setPatchNotesList={setPatchNotesList}
          patchNotesLoaded={patchNotesLoaded}
        />
      )}

      {/* ── Tab: Logs ── */}
      {tab === "logs" && (() => {
        const ACTION_LABELS: Record<string, { label: string; color: string }> = {
          change_plan:     { label: "Plano alterado",     color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
          extend_license:  { label: "Licença estendida",  color: "bg-green-500/20 text-green-300 border-green-500/30" },
          revoke_access:   { label: "Acesso revogado",    color: "bg-red-500/20 text-red-400 border-red-500/30" },
          delete_user:     { label: "Conta excluída",     color: "bg-red-600/20 text-red-400 border-red-600/30" },
          update_user:     { label: "Dados editados",     color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
          create_code:     { label: "Código criado",      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
          delete_code:     { label: "Código removido",    color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
          clear_codes:     { label: "Códigos limpos",     color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
          send_push:       { label: "Push enviado",       color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
          save_config:     { label: "Config salva",       color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
          send_message:    { label: "Mensagem enviada",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
          create_patch:    { label: "Update criado",      color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
          update_patch:    { label: "Update editado",     color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
          delete_patch:    { label: "Update removido",    color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
        }
        const ACTION_FILTERS = [
          { key: "todos",    label: "Todos" },
          { key: "change_plan",    label: "Plano" },
          { key: "extend_license", label: "Licença" },
          { key: "revoke_access",  label: "Acesso" },
          { key: "delete_user",    label: "Exclusões" },
          { key: "update_user",    label: "Edições" },
        ]
        const filtered = logFilter === "todos" ? logs : logs.filter(l => l.action === logFilter)
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>Log de Auditoria</h2>
                <p className={cn("text-xs mt-0.5", darkMode ? "text-white/30" : "text-slate-400")}>Todas as ações realizadas no painel admin</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className={cn("flex gap-0.5 p-0.5 rounded-lg border", darkMode ? "bg-white/3 border-white/8" : "bg-slate-100 border-slate-200")}>
                  {ACTION_FILTERS.map(f => (
                    <button key={f.key} onClick={() => setLogFilter(f.key)}
                      className={cn("text-xs px-3 py-1.5 rounded-md transition-colors",
                        logFilter === f.key ? "bg-primary text-white" : darkMode ? "text-white/40 hover:text-white/70" : "text-slate-500 hover:text-slate-700"
                      )}>{f.label}</button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    startTransition(async () => {
                      const fresh = await adminGetLogs(500)
                      setLogs(fresh)
                    })
                  }}
                  disabled={isPending}
                  className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors",
                    darkMode ? "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70" : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />Atualizar
                </button>
              </div>
            </div>

            <div className={cn("rounded-xl border overflow-hidden", darkMode ? "border-white/8" : "border-slate-200")}>
              {/* Cabeçalho */}
              <div className={cn("grid grid-cols-[140px_1fr_160px_130px] gap-4 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider border-b",
                darkMode ? "bg-white/3 border-white/8 text-white/30" : "bg-slate-50 border-slate-200 text-slate-400")}>
                <span>Admin</span>
                <span>Acao</span>
                <span>Conta afetada</span>
                <span>Data / Hora</span>
              </div>

              {filtered.length === 0 ? (
                <div className={cn("text-center py-12 text-sm", darkMode ? "text-white/30" : "text-slate-400")}>
                  Nenhuma acao registrada ainda.
                </div>
              ) : filtered.map(log => {
                const badge = ACTION_LABELS[log.action] || { label: log.action, color: "bg-white/10 text-white/50 border-white/10" }
                const dt = new Date(log.createdAt)
                const dateStr = `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`
                const timeStr = `${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`
                const isMain = log.adminEmail === "suporte@elevanthe.com"
                return (
                  <div key={log.id} className={cn(
                    "grid grid-cols-[140px_1fr_160px_130px] gap-4 px-4 py-3 border-b text-xs items-start transition-colors",
                    darkMode ? "border-white/5 hover:bg-white/2" : "border-slate-100 hover:bg-slate-50"
                  )}>
                    {/* Admin */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isMain && <ShieldAlert className="size-3 text-amber-400 shrink-0" />}
                      <span className={cn("truncate font-medium", darkMode ? "text-white/70" : "text-slate-700",
                        isMain && "text-amber-400")}>{log.adminEmail}</span>
                    </div>
                    {/* Acao */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className={cn("inline-flex w-fit items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold shrink-0", badge.color)}>
                        {badge.label}
                      </span>
                      <span className={cn("text-xs leading-snug", darkMode ? "text-white/60" : "text-slate-600")}>{log.description}</span>
                    </div>
                    {/* Conta afetada */}
                    <div className={cn("text-xs leading-snug truncate", darkMode ? "text-white/40" : "text-slate-500")}>
                      {log.targetUserEmail || "—"}
                    </div>
                    {/* Data */}
                    <div className={cn("text-xs tabular-nums", darkMode ? "text-white/30" : "text-slate-400")}>
                      <span className="block">{dateStr}</span>
                      <span className={cn("text-[10px]", darkMode ? "text-white/20" : "text-slate-300")}>{timeStr}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className={cn("text-[10px]", darkMode ? "text-white/20" : "text-slate-400")}>
              Exibindo {filtered.length} de {logs.length} registros. A conta <strong className="text-amber-400">suporte@elevanthe.com</strong> e o admin principal.
            </p>
          </div>
        )
      })()}

      </div>
  )
}

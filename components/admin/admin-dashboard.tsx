"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { PromoCode } from "@/lib/db/schema"
import { adminCreatePromoCode, adminDeletePromoCode } from "@/lib/actions"
import { AdminTickets } from "@/components/admin/admin-tickets"
import { LifeBuoy } from "lucide-react"
import { toast } from "sonner"
import {
  Users, ShieldCheck, Tag, BarChart3, LogOut, Plus, Trash2,
  CheckCircle2, XCircle, Clock, RefreshCw
} from "lucide-react"

const PLANS = ["Starter", "Professional", "Enterprise"]

interface StatsData {
  totalUsers: number
  activeUsers: number
  totalCodes: number
  usedCodes: number
  licenseData: {
    userId: string
    userName: string
    userEmail: string
    userCreatedAt: Date
    accessExpiresAt: Date | null
    profileName: string | null
    profileEmail: string | null
    licensePlan: string | null
  }[]
}

function formatDate(d: Date | string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function formatDateTime(d: Date | string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function daysLeft(d: Date | string | null) {
  if (!d) return null
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  return diff
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4">
      <div className={`size-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="size-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/50">{label}</p>
      </div>
    </div>
  )
}

type TicketRow = {
  id: string; subject: string; category: string; status: string; priority: string
  createdAt: Date; updatedAt: Date; userId: string; userName: string | null; userEmail: string | null
}

export default function AdminDashboard({ stats, codes, tickets }: { stats: StatsData; codes: PromoCode[]; tickets: TicketRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<"visao" | "licencas" | "codigos" | "suporte">("visao")
  const [promoForm, setPromoForm] = useState({ code: "", planName: "Starter", days: 30, expiresAt: "" })
  const [showForm, setShowForm] = useState(false)
  const [localCodes, setLocalCodes] = useState(codes)

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" })
    router.push("/admin/login")
  }

  async function handleCreateCode(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await adminCreatePromoCode({
          code: promoForm.code,
          planName: promoForm.planName,
          days: promoForm.days,
          expiresAt: promoForm.expiresAt || undefined,
        })
        toast.success(`Código ${promoForm.code.toUpperCase()} criado!`)
        setPromoForm({ code: "", planName: "Starter", days: 30, expiresAt: "" })
        setShowForm(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao criar código.")
      }
    })
  }

  async function handleDeleteCode(id: string, code: string) {
    if (!confirm(`Excluir o código ${code}?`)) return
    startTransition(async () => {
      try {
        await adminDeletePromoCode(id)
        setLocalCodes(c => c.filter(x => x.id !== id))
        toast.success("Código removido.")
      } catch {
        toast.error("Erro ao remover código.")
      }
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

  const now = new Date()

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <ShieldCheck className="size-4 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-none">Devnix CRM Plus</h1>
            <p className="text-xs text-white/40">Painel de Controle do Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors border border-white/10 rounded-lg px-3 py-1.5 hover:border-white/20"
        >
          <LogOut className="size-3.5" />
          Sair
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total de usuários" value={Number(stats.totalUsers)} color="bg-blue-500/80" />
          <StatCard icon={CheckCircle2} label="Licenças ativas" value={Number(stats.activeUsers)} color="bg-green-500/80" />
          <StatCard icon={Tag} label="Códigos gerados" value={Number(stats.totalCodes)} color="bg-purple-500/80" />
          <StatCard icon={BarChart3} label="Códigos usados" value={Number(stats.usedCodes)} color="bg-amber-500/80" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 w-fit flex-wrap">
          {(["visao", "licencas", "codigos", "suporte"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                tab === t ? "bg-primary text-white shadow" : "text-white/50 hover:text-white/80"
              }`}
            >
              {t === "suporte" && <LifeBuoy className="size-3.5" />}
              {t === "visao" ? "Visao Geral" : t === "licencas" ? "Licencas" : t === "codigos" ? "Codigos Promo" : `Suporte (${tickets.filter(tk => tk.status === "aberto" || tk.status === "em_andamento").length})`}
            </button>
          ))}
        </div>

        {/* Tab: Visão Geral */}
        {tab === "visao" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Usuarios recentes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/40 text-xs border-b border-white/10">
                      <th className="text-left pb-2 font-medium">Nome</th>
                      <th className="text-left pb-2 font-medium">E-mail</th>
                      <th className="text-left pb-2 font-medium">Plano</th>
                      <th className="text-left pb-2 font-medium">Expira em</th>
                      <th className="text-left pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.licenseData.slice(0, 10).map((u) => {
                      const days = daysLeft(u.accessExpiresAt)
                      const isActive = days !== null && days > 0
                      return (
                        <tr key={u.userId} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="py-2.5 text-white font-medium">{u.profileName || u.userName}</td>
                          <td className="py-2.5 text-white/60">{u.profileEmail || u.userEmail}</td>
                          <td className="py-2.5">
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize">
                              {u.licensePlan ?? "Starter"}
                            </span>
                          </td>
                          <td className="py-2.5 text-white/60">{formatDate(u.accessExpiresAt)}</td>
                          <td className="py-2.5">
                            {isActive ? (
                              <span className="flex items-center gap-1.5 text-xs text-green-400">
                                <CheckCircle2 className="size-3.5" />
                                {days}d restantes
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs text-red-400">
                                <XCircle className="size-3.5" />
                                Expirada
                              </span>
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

        {/* Tab: Licenças */}
        {tab === "licencas" && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Todas as licencas</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs border-b border-white/10">
                    <th className="text-left pb-2 font-medium">Empresa</th>
                    <th className="text-left pb-2 font-medium">E-mail</th>
                    <th className="text-left pb-2 font-medium">Plano</th>
                    <th className="text-left pb-2 font-medium">Cadastro</th>
                    <th className="text-left pb-2 font-medium">Vencimento</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.licenseData.map((u) => {
                    const days = daysLeft(u.accessExpiresAt)
                    const isActive = days !== null && days > 0
                    const isWarning = isActive && days! <= 7
                    return (
                      <tr key={u.userId} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-2.5 text-white font-medium">{u.profileName || u.userName}</td>
                        <td className="py-2.5 text-white/60 text-xs">{u.profileEmail || u.userEmail}</td>
                        <td className="py-2.5">
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize">
                            {u.licensePlan ?? "Starter"}
                          </span>
                        </td>
                        <td className="py-2.5 text-white/50 text-xs">{formatDate(u.userCreatedAt)}</td>
                        <td className="py-2.5 text-white/60 text-xs">{formatDate(u.accessExpiresAt)}</td>
                        <td className="py-2.5">
                          {isActive ? (
                            <span className={`flex items-center gap-1 text-xs ${isWarning ? "text-yellow-400" : "text-green-400"}`}>
                              {isWarning ? <Clock className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                              {days}d
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-400">
                              <XCircle className="size-3.5" />Expirada
                            </span>
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

        {/* Tab: Códigos Promo */}
        {tab === "codigos" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Codigos Promocionais</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="size-4" />
                Novo codigo
              </button>
            </div>

            {/* Formulário de criação */}
            {showForm && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Criar novo codigo</h3>
                <form onSubmit={handleCreateCode} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/60">Codigo</label>
                    <div className="flex gap-2">
                      <input
                        required
                        value={promoForm.code}
                        onChange={e => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                        placeholder="DEVNIX-TESTE-30D"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono uppercase placeholder:text-white/20 focus:outline-none focus:border-primary/50"
                      />
                      <button
                        type="button"
                        onClick={generateRandomCode}
                        title="Gerar codigo aleatório"
                        className="px-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <RefreshCw className="size-4 text-white/50" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/60">Plano</label>
                    <select
                      value={promoForm.planName}
                      onChange={e => setPromoForm(f => ({ ...f, planName: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                    >
                      {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/60">Dias concedidos</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={3650}
                      value={promoForm.days}
                      onChange={e => setPromoForm(f => ({ ...f, days: Number(e.target.value) }))}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/60">Expiração do codigo (opcional)</label>
                    <input
                      type="date"
                      value={promoForm.expiresAt}
                      onChange={e => setPromoForm(f => ({ ...f, expiresAt: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="sm:col-span-2 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-sm text-white/50 hover:text-white/80 px-4 py-2 border border-white/10 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="text-sm bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {isPending ? "Criando..." : "Criar codigo"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tabela de códigos */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/40 text-xs border-b border-white/10 bg-white/3">
                      <th className="text-left px-4 py-3 font-medium">Codigo</th>
                      <th className="text-left px-4 py-3 font-medium">Plano</th>
                      <th className="text-left px-4 py-3 font-medium">Dias</th>
                      <th className="text-left px-4 py-3 font-medium">Expira (codigo)</th>
                      <th className="text-left px-4 py-3 font-medium">Usado por</th>
                      <th className="text-left px-4 py-3 font-medium">Usado em</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {localCodes.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center text-white/30 py-8 text-sm">
                          Nenhum codigo criado ainda.
                        </td>
                      </tr>
                    )}
                    {localCodes.map((c) => {
                      const expired = c.expiresAt && new Date(c.expiresAt) < now
                      return (
                        <tr key={c.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="px-4 py-3 font-mono text-white text-xs tracking-wider">{c.code}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{c.planName}</span>
                          </td>
                          <td className="px-4 py-3 text-white/80 font-semibold">+{c.days}d</td>
                          <td className="px-4 py-3 text-white/50 text-xs">{c.expiresAt ? formatDate(c.expiresAt) : "—"}</td>
                          <td className="px-4 py-3 text-white/50 text-xs font-mono">{c.usedBy ? c.usedBy.slice(0, 8) + "..." : "—"}</td>
                          <td className="px-4 py-3 text-white/50 text-xs">{formatDateTime(c.usedAt)}</td>
                          <td className="px-4 py-3">
                            {c.usedBy ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-400">
                                <CheckCircle2 className="size-3.5" />Usado
                              </span>
                            ) : expired ? (
                              <span className="flex items-center gap-1 text-xs text-red-400">
                                <XCircle className="size-3.5" />Expirado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-blue-400">
                                <Clock className="size-3.5" />Disponivel
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {!c.usedBy && (
                              <button
                                onClick={() => handleDeleteCode(c.id, c.code)}
                                className="text-white/30 hover:text-red-400 transition-colors"
                                title="Excluir codigo"
                              >
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

        {/* Tab: Suporte */}
        {tab === "suporte" && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 min-h-[400px] flex flex-col">
            <AdminTickets initialTickets={tickets} />
          </div>
        )}
      </div>
    </div>
  )
}

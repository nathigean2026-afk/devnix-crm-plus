"use client"

import { RefreshCw, Bell, Send, History, Users2, Radio, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PushStats {
  totalSent: number
  lastWeek: number
  subscribers: number
  recent: { title: string; body: string; sentAt: string; success: boolean }[]
}

interface Props {
  darkMode: boolean
  pushStats: PushStats | null
  pushStatsLoading: boolean
  loadPushStats: () => void
  pushTitle: string
  setPushTitle: (v: string) => void
  pushBody: string
  setPushBody: (v: string) => void
  pushUrl: string
  setPushUrl: (v: string) => void
  pushType: "all" | "active"
  setPushType: (v: "all" | "active") => void
  pushSending: boolean
  pushResult: { ok: boolean; message: string } | null
  handleSendPush: () => void
}

export function AdminPushTab({
  darkMode, pushStats, pushStatsLoading, loadPushStats,
  pushTitle, setPushTitle, pushBody, setPushBody,
  pushUrl, setPushUrl, pushType, setPushType,
  pushSending, pushResult, handleSendPush,
}: Props) {
  const inputCls = cn(
    "w-full text-sm rounded-lg px-3 py-2 border outline-none transition-colors",
    darkMode
      ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
      : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-primary/50"
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>
            Push Notifications
          </h2>
          <p className={cn("text-xs mt-0.5", darkMode ? "text-white/30" : "text-slate-400")}>
            Envio de notificacoes para usuarios
          </p>
        </div>
        <button
          onClick={loadPushStats}
          disabled={pushStatsLoading}
          className={cn("flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border transition-colors", darkMode ? "border-white/10 text-white/70 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
        >
          <RefreshCw className={cn("size-3.5", pushStatsLoading && "animate-spin")} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      {pushStats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Send, label: "Total enviados", value: pushStats.totalSent },
            { icon: Radio, label: "Ultima semana", value: pushStats.lastWeek },
            { icon: Users2, label: "Assinantes", value: pushStats.subscribers },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className={cn("rounded-xl border p-4", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")}>
              <Icon className={cn("size-4 mb-2", darkMode ? "text-white/40" : "text-slate-400")} />
              <p className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-800")}>{value}</p>
              <p className={cn("text-xs mt-0.5", darkMode ? "text-white/40" : "text-slate-400")}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Send Form */}
      <div className={cn("rounded-xl border p-5", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")}>
        <div className="flex items-center gap-2 mb-4">
          <Bell className={cn("size-4", darkMode ? "text-white/50" : "text-slate-400")} />
          <h3 className={cn("text-sm font-semibold", darkMode ? "text-white/80" : "text-slate-700")}>Enviar notificacao</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className={cn("text-xs font-medium mb-1.5 block", darkMode ? "text-white/50" : "text-slate-500")}>Titulo *</label>
            <input className={inputCls} placeholder="Titulo da notificacao..." value={pushTitle} onChange={e => setPushTitle(e.target.value)} />
          </div>
          <div>
            <label className={cn("text-xs font-medium mb-1.5 block", darkMode ? "text-white/50" : "text-slate-500")}>Mensagem *</label>
            <textarea rows={3} className={cn(inputCls, "resize-none")} placeholder="Corpo da notificacao..." value={pushBody} onChange={e => setPushBody(e.target.value)} />
          </div>
          <div>
            <label className={cn("text-xs font-medium mb-1.5 block", darkMode ? "text-white/50" : "text-slate-500")}>URL (opcional)</label>
            <input className={inputCls} placeholder="https://..." value={pushUrl} onChange={e => setPushUrl(e.target.value)} />
          </div>
          <div>
            <label className={cn("text-xs font-medium mb-1.5 block", darkMode ? "text-white/50" : "text-slate-500")}>Destinatarios</label>
            <div className="flex gap-2">
              {(["all", "active"] as const).map(t => (
                <button key={t} onClick={() => setPushType(t)} className={cn("text-xs px-3 py-1.5 rounded-lg border transition-colors", pushType === t ? "border-primary bg-primary/10 text-primary" : darkMode ? "border-white/10 text-white/50 hover:border-white/20" : "border-slate-200 text-slate-500 hover:border-slate-300")}>
                  {t === "all" ? "Todos" : "Somente ativos"}
                </button>
              ))}
            </div>
          </div>

          {pushResult && (
            <div className={cn("flex items-center gap-2 text-sm px-3 py-2 rounded-lg", pushResult.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
              {pushResult.ok ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
              {pushResult.message}
            </div>
          )}

          <button
            onClick={handleSendPush}
            disabled={pushSending || !pushTitle || !pushBody}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pushSending ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
            {pushSending ? "Enviando..." : "Enviar notificacao"}
          </button>
        </div>
      </div>

      {/* Recent */}
      {pushStats?.recent && pushStats.recent.length > 0 && (
        <div className={cn("rounded-xl border p-5", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")}>
          <div className="flex items-center gap-2 mb-3">
            <History className={cn("size-4", darkMode ? "text-white/50" : "text-slate-400")} />
            <h3 className={cn("text-sm font-semibold", darkMode ? "text-white/80" : "text-slate-700")}>Recentes</h3>
          </div>
          <div className="space-y-2">
            {pushStats.recent.map((n, i) => (
              <div key={i} className={cn("flex items-start justify-between gap-3 py-2 border-b last:border-0", darkMode ? "border-white/5" : "border-slate-100")}>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium truncate", darkMode ? "text-white/80" : "text-slate-700")}>{n.title}</p>
                  <p className={cn("text-xs truncate mt-0.5", darkMode ? "text-white/40" : "text-slate-400")}>{n.body}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {n.success ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <XCircle className="size-3.5 text-red-400" />}
                  <span className={cn("text-xs", darkMode ? "text-white/30" : "text-slate-400")}>{n.sentAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

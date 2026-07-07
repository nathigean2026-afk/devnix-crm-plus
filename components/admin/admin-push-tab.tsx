"use client"

import { RefreshCw, Bell, Send, History, Users2, Radio, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type PushNotifRow = {
  id: string; title: string; body: string; url: string; type: string
  sentBy: string; totalSent: number; totalFailed: number; createdAt: string
}

interface Props {
  darkMode: boolean
  pushStats: { totalSubscribers: number; notifications: PushNotifRow[] } | null
  pushStatsLoading: boolean
  loadPushStats: () => void
  pushTitle: string
  setPushTitle: (v: string) => void
  pushBody: string
  setPushBody: (v: string) => void
  pushUrl: string
  setPushUrl: (v: string) => void
  pushType: "info" | "promo" | "warning" | "maintenance"
  setPushType: (v: "info" | "promo" | "warning" | "maintenance") => void
  pushSending: boolean
  pushResult: { ok: boolean; msg: string } | null
  handleSendPush: () => void
}

export function AdminPushTab({
  darkMode, pushStats, pushStatsLoading, loadPushStats,
  pushTitle, setPushTitle, pushBody, setPushBody,
  pushUrl, setPushUrl, pushType, setPushType,
  pushSending, pushResult, handleSendPush,
}: Props) {
  const card = cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/10" : "bg-white border-slate-200 shadow-sm")

  const typeLabels: Record<string, string> = { info: "Informativo", promo: "Promoção", warning: "Aviso", maintenance: "Manutenção" }
  const activeColors: Record<string, string> = {
    info: "border-blue-500/40 text-blue-400 bg-blue-500/10",
    promo: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
    warning: "border-amber-500/40 text-amber-400 bg-amber-500/10",
    maintenance: "border-red-500/40 text-red-400 bg-red-500/10",
  }
  const typeColors: Record<string, string> = {
    info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    promo: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    maintenance: "text-red-400 bg-red-500/10 border-red-500/20",
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>Push Notifications</h2>
          <p className={cn("text-xs mt-0.5", darkMode ? "text-white/30" : "text-slate-400")}>Envie notificações para todos os dispositivos inscritos, mesmo com o app fechado</p>
        </div>
        <button onClick={loadPushStats} disabled={pushStatsLoading} className={cn("flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border transition-colors", darkMode ? "border-white/10 text-white/70 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
          <RefreshCw className={cn("size-3.5", pushStatsLoading && "animate-spin")} /> Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className={card}>
        <div className="flex items-center gap-4">
          <div className={cn("flex items-center justify-center size-12 rounded-xl shrink-0", darkMode ? "bg-blue-500/10" : "bg-blue-50")}>
            <Users2 className="size-6 text-blue-400" />
          </div>
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-wider mb-0.5", darkMode ? "text-white/40" : "text-slate-400")}>Dispositivos Inscritos</p>
            {pushStatsLoading
              ? <div className="flex items-center gap-2"><RefreshCw className="size-3.5 animate-spin text-blue-400" /><span className={cn("text-sm", darkMode ? "text-white/40" : "text-slate-400")}>Carregando...</span></div>
              : <p className={cn("text-3xl font-bold tabular-nums", darkMode ? "text-white" : "text-slate-800")}>{pushStats?.totalSubscribers ?? 0}</p>
            }
          </div>
          <div className="ml-auto text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Radio className="size-3.5 text-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Ativo</span>
            </div>
            <p className={cn("text-xs mt-0.5", darkMode ? "text-white/30" : "text-slate-400")}>VAPID configurado</p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className={cn("rounded-xl border p-5 space-y-4", darkMode ? "bg-white/4 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
        <div className="flex items-center gap-2">
          <Bell className={cn("size-4", darkMode ? "text-white/50" : "text-slate-500")} />
          <p className={cn("text-sm font-semibold", darkMode ? "text-white" : "text-slate-800")}>Enviar nova notificação</p>
        </div>
        {/* Tipo */}
        <div className="grid grid-cols-4 gap-2">
          {(["info", "promo", "warning", "maintenance"] as const).map((tp) => (
            <button key={tp} onClick={() => setPushType(tp)}
              className={cn("text-xs py-1.5 px-2 rounded-lg border transition-colors font-medium",
                pushType === tp ? activeColors[tp] : darkMode ? "border-white/10 text-white/40 hover:text-white/70" : "border-slate-200 text-slate-400 hover:text-slate-600"
              )}
            >{typeLabels[tp]}</button>
          ))}
        </div>
        {/* Título */}
        <div>
          <label className={cn("block text-xs font-medium mb-1.5", darkMode ? "text-white/50" : "text-slate-500")}>Título *</label>
          <input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder="Ex: Manutenção programada" maxLength={60}
            className={cn("w-full rounded-lg px-3 py-2 text-sm focus:outline-none border", darkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-slate-200 text-slate-800")} />
          <p className={cn("text-right text-[10px] mt-0.5", darkMode ? "text-white/20" : "text-slate-400")}>{pushTitle.length}/60</p>
        </div>
        {/* Mensagem */}
        <div>
          <label className={cn("block text-xs font-medium mb-1.5", darkMode ? "text-white/50" : "text-slate-500")}>Mensagem *</label>
          <textarea value={pushBody} onChange={e => setPushBody(e.target.value)} placeholder="Ex: O sistema ficará indisponível hoje das 23h às 01h." maxLength={200} rows={3}
            className={cn("w-full rounded-lg px-3 py-2 text-sm focus:outline-none border resize-none", darkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-slate-200 text-slate-800")} />
          <p className={cn("text-right text-[10px] mt-0.5", darkMode ? "text-white/20" : "text-slate-400")}>{pushBody.length}/200</p>
        </div>
        {/* URL */}
        <div>
          <label className={cn("block text-xs font-medium mb-1.5", darkMode ? "text-white/50" : "text-slate-500")}>URL ao clicar</label>
          <input value={pushUrl} onChange={e => setPushUrl(e.target.value)} placeholder="/dashboard"
            className={cn("w-full rounded-lg px-3 py-2 text-sm focus:outline-none border", darkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-slate-200 text-slate-800")} />
        </div>
        {/* Resultado */}
        {pushResult && (
          <div className={cn("flex items-start gap-2 text-xs p-3 rounded-lg border",
            pushResult.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          )}>
            {pushResult.ok ? <CheckCircle2 className="size-4 shrink-0 mt-0.5" /> : <XCircle className="size-4 shrink-0 mt-0.5" />}
            <span>{pushResult.msg}</span>
          </div>
        )}
        {/* Botão */}
        <button onClick={handleSendPush} disabled={pushSending || !pushTitle.trim() || !pushBody.trim()}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          {pushSending
            ? <><RefreshCw className="size-4 animate-spin" />Enviando...</>
            : <><Send className="size-4" />Enviar para {pushStats?.totalSubscribers ?? 0} dispositivo(s)</>
          }
        </button>
      </div>

      {/* Histórico */}
      <div className={cn("rounded-xl border p-5 space-y-3", darkMode ? "bg-white/4 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
        <div className="flex items-center gap-2">
          <History className={cn("size-4", darkMode ? "text-white/50" : "text-slate-500")} />
          <p className={cn("text-sm font-semibold", darkMode ? "text-white" : "text-slate-800")}>Histórico recente</p>
        </div>
        {pushStatsLoading ? (
          <div className="flex items-center gap-2 py-4"><RefreshCw className="size-4 animate-spin text-blue-400" /><span className={cn("text-sm", darkMode ? "text-white/40" : "text-slate-400")}>Carregando...</span></div>
        ) : !pushStats?.notifications?.length ? (
          <p className={cn("text-sm py-4 text-center", darkMode ? "text-white/30" : "text-slate-400")}>Nenhuma notificação enviada ainda.</p>
        ) : (
          <div className="space-y-2">
            {pushStats.notifications.map((n) => (
              <div key={n.id} className={cn("rounded-lg p-3 border", darkMode ? "bg-white/3 border-white/8" : "bg-slate-50 border-slate-200")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", typeColors[n.type] ?? typeColors.info)}>{typeLabels[n.type] ?? n.type}</span>
                      <p className={cn("text-xs font-semibold truncate", darkMode ? "text-white" : "text-slate-800")}>{n.title}</p>
                    </div>
                    <p className={cn("text-xs truncate", darkMode ? "text-white/40" : "text-slate-500")}>{n.body}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-emerald-400 font-medium">{n.totalSent} enviado(s)</p>
                    {n.totalFailed > 0 && <p className="text-[10px] text-red-400">{n.totalFailed} falhou</p>}
                    <p className={cn("text-[10px] mt-0.5", darkMode ? "text-white/25" : "text-slate-400")}>
                      {new Date(n.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

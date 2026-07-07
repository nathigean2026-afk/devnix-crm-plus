"use client"

import { RefreshCw, XCircle, Link2Off, QrCode, Smartphone, FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

type ZapiStatus = { connected: boolean; smartphoneConnected?: boolean; session?: string; error?: string } | null

interface Props {
  darkMode: boolean
  zapiStatus: ZapiStatus
  zapiLoading: boolean
  loadZapiStatus: () => void
  handleZapiDisconnect: () => void
}

export function AdminWhatsappTab({ darkMode, zapiStatus, zapiLoading, loadZapiStatus, handleZapiDisconnect }: Props) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>
            WhatsApp via Z-API
          </h2>
          <p className={cn("text-xs mt-0.5", darkMode ? "text-white/30" : "text-slate-400")}>
            Gerenciamento da instancia Z-API
          </p>
        </div>
        <button
          onClick={loadZapiStatus}
          disabled={zapiLoading}
          className={cn("flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border transition-colors", darkMode ? "border-white/10 text-white/70 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
        >
          <RefreshCw className={cn("size-3.5", zapiLoading && "animate-spin")} />
          Atualizar status
        </button>
      </div>

      {/* Status Card */}
      <div className={cn("rounded-xl border p-5", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("size-10 rounded-xl flex items-center justify-center", zapiStatus?.connected ? "bg-emerald-500/15" : "bg-slate-500/15")}>
              <Smartphone className={cn("size-5", zapiStatus?.connected ? "text-emerald-400" : darkMode ? "text-white/40" : "text-slate-400")} />
            </div>
            <div>
              <p className={cn("text-sm font-semibold", darkMode ? "text-white" : "text-slate-800")}>
                {zapiStatus === null ? "Verificando..." : zapiStatus.connected ? "Conectado" : "Desconectado"}
              </p>
              <p className={cn("text-xs mt-0.5", darkMode ? "text-white/40" : "text-slate-400")}>
                {zapiStatus?.session ? `Sessao: ${zapiStatus.session}` : "Instancia Z-API"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
              zapiStatus?.connected ? "bg-emerald-500/15 text-emerald-400" : darkMode ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500"
            )}>
              <span className={cn("size-1.5 rounded-full", zapiStatus?.connected ? "bg-emerald-400 animate-pulse" : "bg-slate-400")} />
              {zapiStatus?.connected ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {zapiStatus?.connected && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className={cn("size-3.5", zapiStatus.smartphoneConnected ? "text-emerald-400" : "text-amber-400")} />
              <span className={cn("text-xs", darkMode ? "text-white/50" : "text-slate-500")}>
                Smartphone: {zapiStatus.smartphoneConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            <button
              onClick={handleZapiDisconnect}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Link2Off className="size-3.5" />
              Desconectar
            </button>
          </div>
        )}

        {zapiStatus && !zapiStatus.connected && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className={cn("text-xs mb-3", darkMode ? "text-white/40" : "text-slate-400")}>
              Escaneie o QR Code no painel Z-API para reconectar:
            </p>
            <div className={cn("flex items-center justify-center rounded-lg border-2 border-dashed h-32", darkMode ? "border-white/10" : "border-slate-200")}>
              <div className="text-center">
                <QrCode className={cn("size-8 mx-auto mb-2", darkMode ? "text-white/20" : "text-slate-300")} />
                <p className={cn("text-xs", darkMode ? "text-white/30" : "text-slate-400")}>QR Code disponivel no painel Z-API</p>
              </div>
            </div>
          </div>
        )}

        {zapiStatus?.error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
            <XCircle className="size-3.5 shrink-0" />
            <span>{zapiStatus.error}</span>
          </div>
        )}
      </div>

      {/* Sandbox Test */}
      <div className={cn("rounded-xl border p-5", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")}>
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className={cn("size-4", darkMode ? "text-white/50" : "text-slate-500")} />
          <h3 className={cn("text-sm font-semibold", darkMode ? "text-white/80" : "text-slate-700")}>Como funcionam as notificacoes</h3>
        </div>
        <ul className="space-y-2">
          {[
            "Configure as variaveis ZAPI_INSTANCE_ID, ZAPI_TOKEN e ZAPI_CLIENT_TOKEN no painel.",
            'Clique em "Atualizar status" para verificar a conexao com a instancia.',
            "Se desconectado, escaneie o QR Code com o WhatsApp do numero de envio.",
            "Apos conectar, o sistema enviara mensagens automaticas para os usuarios.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={cn("size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                darkMode ? "bg-white/8 text-white/50" : "bg-slate-100 text-slate-500"
              )}>{i + 1}</span>
              <span className={cn("text-xs leading-relaxed", darkMode ? "text-white/50" : "text-slate-500")}>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

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
  const card = cn("rounded-xl border p-5", darkMode ? "bg-white/4 border-white/10" : "bg-white border-slate-200 shadow-sm")
  const label = cn("text-xs font-semibold uppercase tracking-wider", darkMode ? "text-white/40" : "text-slate-400")
  const text = cn("text-sm", darkMode ? "text-white/60" : "text-slate-500")

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>
            WhatsApp via Z-API
          </h2>
          <p className={cn("text-xs mt-0.5", darkMode ? "text-white/30" : "text-slate-400")}>
            Gerenciamento da instância Z-API
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

      {/* Status card */}
      <div className={card}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className={label}>Status da Instância</p>
            {zapiLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="size-4 animate-spin text-blue-400" />
                <span className={text}>Verificando conexão...</span>
              </div>
            ) : zapiStatus?.error ? (
              <div className="flex items-center gap-2">
                <XCircle className="size-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Erro de conexão</p>
                  <p className={cn("text-xs mt-0.5", darkMode ? "text-white/40" : "text-slate-400")}>{zapiStatus.error}</p>
                </div>
              </div>
            ) : zapiStatus?.connected ? (
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Conectado</p>
                  {zapiStatus.session && (
                    <p className={cn("text-xs mt-0.5 font-mono", darkMode ? "text-white/30" : "text-slate-400")}>Sessão: {zapiStatus.session}</p>
                  )}
                </div>
              </div>
            ) : zapiStatus ? (
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-amber-400" />
                <p className="text-sm font-semibold text-amber-400">Desconectado — escaneie o QR Code</p>
              </div>
            ) : (
              <p className={text}>Clique em &quot;Atualizar status&quot; para verificar.</p>
            )}
          </div>

          {zapiStatus?.connected && (
            <button
              onClick={handleZapiDisconnect}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-400/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Link2Off className="size-3.5" />
              Desconectar
            </button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: QrCode, title: "QR Code", desc: "Escaneie com o WhatsApp para conectar a instância Z-API ao número de telefone.", color: "text-purple-400", bg: darkMode ? "bg-purple-500/10" : "bg-purple-50" },
          { icon: Smartphone, title: "Smartphone conectado", desc: zapiStatus?.smartphoneConnected ? "Sim — telefone vinculado e ativo." : "Não detectado ainda.", color: zapiStatus?.smartphoneConnected ? "text-emerald-400" : "text-amber-400", bg: darkMode ? "bg-white/4" : "bg-slate-50" },
          { icon: FlaskConical, title: "Sandbox / Produção", desc: "Esta instância opera em modo de produção com a Z-API. Certifique-se de que a chave está ativa.", color: "text-blue-400", bg: darkMode ? "bg-blue-500/10" : "bg-blue-50" },
        ].map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className={cn("rounded-xl border p-4 flex gap-3", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white shadow-sm")}>
            <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", bg)}>
              <Icon className={cn("size-4", color)} />
            </div>
            <div>
              <p className={cn("text-xs font-semibold", darkMode ? "text-white/70" : "text-slate-700")}>{title}</p>
              <p className={cn("text-xs mt-0.5 leading-relaxed", darkMode ? "text-white/35" : "text-slate-400")}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Como funciona */}
      <div className={cn("rounded-xl border p-5", darkMode ? "bg-white/3 border-white/8" : "bg-slate-50 border-slate-200")}>
        <p className={cn("text-xs font-semibold mb-3", darkMode ? "text-white/50" : "text-slate-500")}>Como funciona</p>
        <ul className="space-y-2">
          {[
            "Configure as variáveis ZAPI_INSTANCE_ID, ZAPI_TOKEN e ZAPI_CLIENT_TOKEN no painel.",
            'Clique em "Atualizar status" para verificar a conexão com a instância.',
            "Se desconectado, escaneie o QR Code com o WhatsApp do número de envio.",
            "Após conectar, o sistema enviará mensagens automáticas para os usuários.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={cn("size-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5", darkMode ? "bg-white/10 text-white/50" : "bg-slate-200 text-slate-500")}>{i + 1}</span>
              <span className={cn("text-xs leading-relaxed", darkMode ? "text-white/40" : "text-slate-500")}>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

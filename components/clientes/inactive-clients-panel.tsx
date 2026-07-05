"use client"

import { useState, useEffect, useCallback } from "react"
import { getInactiveClients } from "@/lib/actions"
import type { Client } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageCircle, Clock, UserX, RefreshCw, Loader2, Phone, Building2
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

type InactiveClient = Client & { lastActivityDate: Date | null }

const PERIOD_OPTIONS = [
  { label: "30 dias", value: "30" },
  { label: "60 dias", value: "60" },
  { label: "90 dias", value: "90" },
  { label: "180 dias", value: "180" },
  { label: "1 ano", value: "365" },
]

const WA_MESSAGES = [
  (name: string) =>
    `Olá ${name}! Tudo bem? Faz um tempo que não temos notícias suas. Posso te ajudar com algum serviço? Estamos aqui!`,
  (name: string) =>
    `Oi ${name}! Sentimos sua falta. Que tal conversarmos sobre um novo projeto? Tenho algumas novidades para te mostrar!`,
  (name: string) =>
    `Olá ${name}, tudo certo? Estamos com novidades e condições especiais. Posso te apresentar?`,
]

function formatLastActivity(date: Date | null): string {
  if (!date) return "Sem atividade registrada"
  return `Última atividade ${formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })}`
}

function getInactivityColor(date: Date | null): string {
  if (!date) return "text-red-400 bg-red-500/10 border-red-500/20"
  const days = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  if (days > 180) return "text-red-400 bg-red-500/10 border-red-500/20"
  if (days > 90) return "text-orange-400 bg-orange-500/10 border-orange-500/20"
  return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
}

function openWhatsApp(client: InactiveClient, msgIdx: number) {
  const name = client.name.split(" ")[0]
  const msg = WA_MESSAGES[msgIdx % WA_MESSAGES.length](name)
  const phone = client.phone?.replace(/\D/g, "") ?? ""
  const url = phone
    ? `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`
  window.open(url, "_blank")
}

export function InactiveClientsPanel() {
  const [days, setDays] = useState("90")
  const [clients, setClients] = useState<InactiveClient[]>([])
  const [loading, setLoading] = useState(true)
  const [msgIndex, setMsgIndex] = useState(0)

  const load = useCallback(async (d: string) => {
    setLoading(true)
    try {
      const data = await getInactiveClients(Number(d))
      setClients(data as InactiveClient[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(days) }, [days, load])

  return (
    <div className="flex flex-col gap-5">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <UserX className="size-4 text-orange-400" />
            Clientes sem contato
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Clientes ativos sem OS ou orçamento no periodo selecionado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={(v) => setDays(v ?? "90")}>
            <SelectTrigger className="w-32 bg-input border-border text-foreground text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {PERIOD_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => load(days)}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Seletor de mensagem */}
      {clients.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Modelo de mensagem WhatsApp
          </p>
          <div className="flex gap-2 flex-wrap mb-2">
            {WA_MESSAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setMsgIndex(i)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  msgIndex === i
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                Mensagem {i + 1}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            &ldquo;{WA_MESSAGES[msgIndex]("[Nome]")}&rdquo;
          </p>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="size-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <MessageCircle className="size-6 text-green-400" />
          </div>
          <p className="font-semibold text-foreground">Todos os clientes estao ativos!</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Nenhum cliente ativo ficou sem contato nos ultimos {days} dias.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground -mt-2">
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} sem contato ha mais de {days} dias
          </p>

          {/* Mobile: cards */}
          <div className="flex flex-col gap-2 sm:hidden">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {client.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{client.name}</p>
                  <div className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border mt-0.5 ${getInactivityColor(client.lastActivityDate)}`}>
                    <Clock className="size-2.5" />
                    {formatLastActivity(client.lastActivityDate)}
                  </div>
                </div>
                {client.phone && (
                  <Button
                    size="sm"
                    onClick={() => openWhatsApp(client, msgIndex)}
                    className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white shrink-0 gap-1.5"
                  >
                    <MessageCircle className="size-3.5" />
                    <span className="sr-only">WhatsApp</span>
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: tabela */}
          <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ultima atividade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Telefone</th>
                  <th className="px-4 py-3 w-36" />
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => (
                  <tr
                    key={client.id}
                    className={`border-b border-border last:border-0 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/10"} hover:bg-muted/20`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {client.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {client.company ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="size-3 shrink-0" />
                          {client.company}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${getInactivityColor(client.lastActivityDate)}`}>
                        <Clock className="size-3" />
                        {formatLastActivity(client.lastActivityDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {client.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3 shrink-0" />
                          {client.phone}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {client.phone ? (
                        <Button
                          size="sm"
                          onClick={() => openWhatsApp(client, msgIndex)}
                          className="w-full h-8 bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs"
                        >
                          <MessageCircle className="size-3.5" />
                          Reativar no WhatsApp
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem telefone</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

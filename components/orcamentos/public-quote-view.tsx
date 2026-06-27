"use client"

import type { Client, Quote, QuoteItem, BusinessProfile } from "@/lib/db/schema"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import {
  MapPin, Mail, Phone, Calendar, Hash, Printer,
  MessageCircle, CheckCircle, XCircle, AlertCircle,
  Loader2, ArrowLeft, FileCheck, ThumbsUp, ThumbsDown, Clock, Building2,
} from "lucide-react"
import { useState } from "react"
import { respondQuote } from "@/lib/actions"

interface PublicQuoteViewProps {
  quote: Quote & { respondedAt?: Date | string | null }
  client: Client | null
  items: QuoteItem[]
  providerPhone?: string | null
  profile?: BusinessProfile | null
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  rascunho:  { label: "Rascunho",              color: "bg-muted text-muted-foreground border-border",             dot: "bg-gray-400" },
  enviado:   { label: "Aguardando resposta",    color: "bg-blue-500/15 text-blue-400 border-blue-500/20",          dot: "bg-blue-400 animate-pulse" },
  aprovado:  { label: "Aprovado",               color: "bg-green-500/15 text-green-400 border-green-500/20",       dot: "bg-green-400" },
  recusado:  { label: "Recusado",               color: "bg-red-500/15 text-red-400 border-red-500/20",             dot: "bg-red-400" },
  cancelado: { label: "Cancelado",              color: "bg-muted text-muted-foreground border-border",             dot: "bg-gray-400" },
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

/** Converte "YYYY-MM-DD" sem criar UTC meia-noite (evita hydration mismatch de timezone) */
function formatLocalDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const [y, m, d] = dateStr.split("-")
  return `${d}/${m}/${y}`
}

/** Formata timestamp com data e hora local */
function formatDateTime(ts: Date | string | null | undefined): string {
  if (!ts) return ""
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatTimestamp(ts: Date | string): string {
  const d = new Date(ts)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function PublicQuoteView({ quote, client, items, providerPhone, profile }: PublicQuoteViewProps) {
  const alreadyRespondedAt = (quote as PublicQuoteViewProps["quote"]).respondedAt

  const [step, setStep] = useState<"idle" | "reject-form" | "loading" | "done-accept" | "done-reject">(
    quote.status === "aprovado" ? "done-accept"
    : quote.status === "recusado" ? "done-reject"
    : "idle"
  )
  const [rejectionReason, setRejectionReason] = useState(
    (quote as Quote & { rejectionReason?: string }).rejectionReason ?? ""
  )
  const [respondedAt, setRespondedAt] = useState<Date | null>(
    alreadyRespondedAt ? new Date(alreadyRespondedAt) : null
  )
  const [error, setError] = useState<string | null>(null)

  const canRespond = quote.status === "rascunho" || quote.status === "enviado"
  const currentStatus = step === "done-accept" ? "aprovado" : step === "done-reject" ? "recusado" : quote.status
  const sc = statusConfig[currentStatus] ?? statusConfig.rascunho

  /** Abre WhatsApp direto no número do prestador com a mensagem de notificação */
  function notifyProviderWhatsApp(type: "aprovado" | "recusado") {
    const url = window.location.href
    const clientName = client?.name ?? "Cliente"
    const label = `#${String(quote.number).padStart(4, "0")} — ${quote.title}`
    const dateStr = respondedAt ? formatDateTime(respondedAt) : formatDateTime(new Date())

    const msg = type === "aprovado"
      ? `✅ *Orçamento Aprovado!*\n\nO orçamento *${label}* foi *APROVADO* por *${clientName}*.\n📅 Data: ${dateStr}\n💰 Total: ${formatCurrency(quote.total)}\n\nUma OS foi gerada automaticamente no sistema.\n🔗 ${url}`
      : `❌ *Orçamento Recusado*\n\nO orçamento *${label}* foi *RECUSADO* por *${clientName}*.\n📅 Data: ${dateStr}\n💬 Motivo: "${rejectionReason || "Não informado"}"\n\nRevise e envie uma nova proposta:\n🔗 ${url}`

    const phone = providerPhone?.replace(/\D/g, "") ?? ""
    window.open(
      phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`,
      "_blank"
    )
  }

  function openWhatsAppShare() {
    const url = window.location.href
    const phone = client?.phone?.replace(/\D/g, "") ?? ""
    const text = `Olá${client ? ` ${client.name}` : ""}! Aqui está seu orçamento *#${String(quote.number).padStart(4, "0")} — ${quote.title}*\nTotal: ${formatCurrency(quote.total)}\n\nAcesse e responda: ${url}`
    window.open(
      phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    )
  }

  async function handleAccept() {
    setError(null)
    setStep("loading")
    const result = await respondQuote(quote.id, "aprovado")
    if (!result.success) {
      setError(result.error ?? "Erro ao processar. Tente novamente.")
      setStep("idle")
      return
    }
    setRespondedAt(new Date())
    setStep("done-accept")
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setError("Informe o motivo da recusa para que possamos ajustar a proposta.")
      return
    }
    setError(null)
    setStep("loading")
    const result = await respondQuote(quote.id, "recusado", rejectionReason.trim())
    if (!result.success) {
      setError(result.error ?? "Erro ao processar. Tente novamente.")
      setStep("reject-form")
      return
    }
    setRespondedAt(new Date())
    setStep("done-reject")
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-0">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileCheck className="size-4" />
            <span>Orçamento #{String(quote.number).padStart(4, "0")}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openWhatsAppShare}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-95 rounded-lg px-3 py-2 transition-all"
            >
              <MessageCircle className="size-3.5" />
              Compartilhar
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 transition-all"
            >
              <Printer className="size-3.5" />
              PDF
            </button>
          </div>
        </div>

        {/* ── Card principal ── */}
        <div className="rounded-2xl border border-border overflow-hidden" style={{ background: "var(--card)" }}>

          {/* Header */}
          <div className="px-6 py-6 border-b border-border" style={{ background: "var(--secondary)" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="size-10 rounded-xl border border-border flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "var(--muted)" }}>
                  {profile?.logo ? (
                    <Image
                      src={profile.logo}
                      alt={profile.name ?? "Logo"}
                      width={40}
                      height={40}
                      className="object-contain"
                      style={{ width: 40, height: "auto" }}
                    />
                  ) : (
                    <Building2 className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5 leading-tight">
                    {profile?.name || "Elevanthe CRM"}
                  </p>
                  {profile?.document && (
                    <p className="text-[10px] text-muted-foreground/70 mb-0.5">{profile.document}</p>
                  )}
                  <h1 className="text-xl font-bold text-foreground leading-snug break-words">{quote.title}</h1>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge className={`${sc.color} border text-xs font-semibold flex items-center gap-1.5`}>
                  <span className={`size-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </Badge>
                {/* Data/hora da resposta */}
                {respondedAt && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="size-2.5" />
                    {formatDateTime(respondedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Hash className="size-3" />
                #{String(quote.number).padStart(4, "0")}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3" />
                Emitido em {formatTimestamp(quote.createdAt)}
              </span>
              {quote.validUntil && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  Válido até {formatLocalDate(quote.validUntil)}
                </span>
              )}
            </div>
          </div>

          {/* Destinatário */}
          {client && (
            <div className="px-6 py-5 border-b border-border">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Para</p>
              <p className="font-bold text-foreground text-base">{client.name}</p>
              {client.company && <p className="text-sm text-muted-foreground mt-0.5">{client.company}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="size-3" />{client.email}
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="size-3" />{client.phone}
                  </a>
                )}
                {client.city && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3" />{client.city}{client.state ? `, ${client.state}` : ""}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Itens */}
          <div className="px-6 py-5 border-b border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">Itens</p>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum item adicionado.</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border" style={{ background: "var(--muted)" }}>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Descrição</span>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Qtd</span>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Unit.</span>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Total</span>
                </div>
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className={`px-4 py-3 border-b border-border last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}
                  >
                    <div className="flex flex-col gap-1 sm:hidden">
                      <p className="text-sm font-medium text-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(item.quantity).toLocaleString("pt-BR")} × {formatCurrency(item.unitPrice)} = <span className="font-semibold text-foreground">{formatCurrency(item.total)}</span>
                      </p>
                    </div>
                    <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center">
                      <span className="text-sm text-foreground">{item.description}</span>
                      <span className="text-sm text-muted-foreground text-right w-12">{Number(item.quantity).toLocaleString("pt-BR")}</span>
                      <span className="text-sm text-muted-foreground text-right w-24">{formatCurrency(item.unitPrice)}</span>
                      <span className="text-sm font-semibold text-foreground text-right w-24">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totais */}
            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(quote.subtotal)}</span>
                </div>
                {Number(quote.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-green-400 font-medium">- {formatCurrency(quote.discount)}</span>
                  </div>
                )}
                <Separator className="bg-border my-1" />
                <div className="flex justify-between">
                  <span className="font-bold text-foreground text-base">Total</span>
                  <span className="font-bold text-foreground text-lg">{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          {quote.notes && (
            <div className="px-6 py-5 border-b border-border">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Observações</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* ── Área de resposta do cliente ── */}
          {canRespond && (
            <div className="px-6 py-6 print:hidden">

              {/* Estado: loading */}
              {step === "loading" && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="relative size-16">
                    <div className="absolute inset-0 rounded-full border-4 border-border" />
                    <Loader2 className="absolute inset-0 size-16 text-foreground animate-spin" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Processando sua resposta…</p>
                    <p className="text-sm text-muted-foreground mt-1">Aguarde um instante</p>
                  </div>
                </div>
              )}

              {/* Estado: aprovado */}
              {step === "done-accept" && (
                <div className="flex flex-col items-center gap-5 py-6 text-center">
                  <div className="size-16 rounded-full bg-green-500/15 flex items-center justify-center">
                    <CheckCircle className="size-8 text-green-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">Orçamento aprovado!</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                      Ótimo! Sua confirmação foi registrada e uma ordem de serviço foi gerada automaticamente.
                    </p>
                    {respondedAt && (
                      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-2">
                        <Clock className="size-3" />
                        Registrado em {formatDateTime(respondedAt)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => notifyProviderWhatsApp("aprovado")}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold rounded-xl px-5 py-3 text-sm transition-all"
                  >
                    <MessageCircle className="size-4" />
                    Notificar prestador pelo WhatsApp
                  </button>
                </div>
              )}

              {/* Estado: recusado */}
              {step === "done-reject" && (
                <div className="flex flex-col items-center gap-5 py-6 text-center">
                  <div className="size-16 rounded-full bg-red-500/15 flex items-center justify-center">
                    <XCircle className="size-8 text-red-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">Recusa registrada</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                      Agradecemos o retorno. O prestador receberá o motivo e poderá ajustar a proposta.
                    </p>
                    {respondedAt && (
                      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-2">
                        <Clock className="size-3" />
                        Registrado em {formatDateTime(respondedAt)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => notifyProviderWhatsApp("recusado")}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold rounded-xl px-5 py-3 text-sm transition-all"
                  >
                    <MessageCircle className="size-4" />
                    Notificar prestador pelo WhatsApp
                  </button>
                </div>
              )}

              {/* Estado: idle */}
              {step === "idle" && (
                <div className="flex flex-col gap-4">
                  <div className="text-center pb-2">
                    <p className="font-semibold text-foreground">O que você decide?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aceite para prosseguirmos ou recuse informando o motivo.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <AlertCircle className="size-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleAccept}
                      className="flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold rounded-xl px-4 py-5 transition-all"
                    >
                      <ThumbsUp className="size-6" strokeWidth={1.5} />
                      <span className="text-sm">Aceitar orçamento</span>
                    </button>
                    <button
                      onClick={() => { setStep("reject-form"); setError(null) }}
                      className="flex flex-col items-center gap-2 border border-red-500/30 hover:bg-red-500/10 active:scale-95 text-red-400 font-semibold rounded-xl px-4 py-5 transition-all"
                    >
                      <ThumbsDown className="size-6" strokeWidth={1.5} />
                      <span className="text-sm">Recusar orçamento</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Estado: formulário de recusa */}
              {step === "reject-form" && (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => { setStep("idle"); setError(null) }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
                  >
                    <ArrowLeft className="size-3.5" />
                    Voltar
                  </button>

                  <div>
                    <p className="font-semibold text-foreground">Motivo da recusa</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Seu feedback ajuda o prestador a ajustar a proposta.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <AlertCircle className="size-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ex: valor acima do esperado, prazo incompatível, preciso de ajustes nos itens…"
                    rows={4}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                    style={{ background: "var(--input, var(--muted))" }}
                  />

                  <button
                    onClick={handleReject}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold rounded-xl px-6 py-3.5 text-sm transition-all w-full"
                  >
                    <XCircle className="size-4" />
                    Confirmar recusa
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Orçamento já respondido — estado fixo com data/hora */}
          {!canRespond && (quote.status === "aprovado" || quote.status === "recusado") && (
            <div className="px-6 py-5 print:hidden">
              {quote.status === "aprovado" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3.5">
                    <CheckCircle className="size-5 text-green-400 shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-semibold text-green-400">Orçamento aprovado</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Uma ordem de serviço foi gerada automaticamente.</p>
                      {alreadyRespondedAt && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="size-2.5" />
                          {formatDateTime(alreadyRespondedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3.5">
                    <XCircle className="size-5 text-red-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-semibold text-red-400">Orçamento recusado</p>
                      {(quote as Quote & { rejectionReason?: string }).rejectionReason && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Motivo: {(quote as Quote & { rejectionReason?: string }).rejectionReason}
                        </p>
                      )}
                      {alreadyRespondedAt && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="size-2.5" />
                          {formatDateTime(alreadyRespondedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 pb-4">
          Orçamento gerado por{" "}
          <span className="font-semibold text-foreground">
            {profile?.name ? `${profile.name} via Elevanthe CRM` : "Elevanthe CRM"}
          </span>
        </p>
      </div>
    </div>
  )
}

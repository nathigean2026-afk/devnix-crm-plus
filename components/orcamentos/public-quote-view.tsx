"use client"

import type { Client, Quote, QuoteItem, BusinessProfile } from "@/lib/db/schema"
import Image from "next/image"
import {
  MapPin, Mail, Phone, Calendar, Hash, Printer,
  MessageCircle, CheckCircle, XCircle, AlertCircle,
  Loader2, ArrowLeft, FileCheck, ThumbsUp, ThumbsDown, Clock,
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

const statusConfig: Record<string, { label: string; dot: string }> = {
  rascunho:  { label: "Rascunho",            dot: "#94a3b8" },
  enviado:   { label: "Aguardando resposta",  dot: "#3b82f6" },
  aprovado:  { label: "Aprovado",             dot: "#22c55e" },
  recusado:  { label: "Recusado",             dot: "#ef4444" },
  cancelado: { label: "Cancelado",            dot: "#94a3b8" },
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

function formatLocalDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const [y, m, d] = dateStr.split("-")
  return `${d}/${m}/${y}`
}

function formatDateTime(ts: Date | string | null | undefined): string {
  if (!ts) return ""
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ""
  // Usa UTC para garantir que servidor e cliente renderizem o mesmo valor
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} às ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

function formatTimestamp(ts: Date | string): string {
  const d = new Date(ts)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function getBranding(profile: BusinessProfile | null | undefined) {
  const isPaid = profile?.licensePlan === "business" || profile?.licensePlan === "enterprise"
  return {
    name:        (isPaid && profile?.name)     ? profile.name     : "Elevanthe CRM",
    logo:        (isPaid && profile?.logo)     ? profile.logo     : "/elevanthe-logo-neon.png",
    document:    (isPaid && profile?.document) ? profile.document : null,
    phone:       (isPaid && profile?.phone)    ? profile.phone    : null,
    email:       (isPaid && profile?.email)    ? profile.email    : null,
    address:     (isPaid && profile?.address)  ? profile.address  : null,
    city:        (isPaid && profile?.city)     ? profile.city     : null,
    state:       (isPaid && profile?.state)    ? profile.state    : null,
    website:     (isPaid && profile?.website)  ? profile.website  : null,
    accentColor: profile?.docAccentColor ?? "#1d4ed8",
    docFooter:   (isPaid && profile?.docFooter) ? profile.docFooter : null,
    isPaid,
  }
}

export function PublicQuoteView({ quote, client, items, providerPhone, profile }: PublicQuoteViewProps) {
  const alreadyRespondedAt = (quote as PublicQuoteViewProps["quote"]).respondedAt
  const branding = getBranding(profile)
  const accentColor = branding.accentColor

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
    <div className="min-h-screen bg-[#f1f5f9] py-8 px-4 print:py-0 print:px-0 print:bg-white font-sans">

      {/* Barra de ações */}
      <div className="max-w-2xl mx-auto flex items-center justify-between mb-5 print:hidden">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <FileCheck className="size-4" />
          <span>Orçamento {`#${String(quote.number).padStart(4, "0")}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openWhatsAppShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-lg px-3 py-2 transition-all active:scale-95"
            style={{ backgroundColor: "#16a34a" }}
          >
            <MessageCircle className="size-3.5" />
            Compartilhar
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg px-3 py-2 transition-all"
          >
            <Printer className="size-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Card principal */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">

        {/* ── Header com cor de destaque ── */}
        <div className="px-7 py-7 text-white print:px-6" style={{ backgroundColor: accentColor }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="size-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                <Image
                  src={branding.logo}
                  alt={branding.name}
                  width={64}
                  height={64}
                  className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                  style={{ width: 64, height: "auto" }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                  {branding.name}
                </p>
                {branding.document && (
                  <p className="text-white/50 text-[10px] mb-0.5">{branding.document}</p>
                )}
                <h1 className="text-xl font-bold leading-snug break-words">{quote.title}</h1>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <p className="text-white/60 text-[10px] uppercase tracking-widest">Orçamento</p>
              <p className="text-3xl font-black tabular-nums leading-none">
                {`#${String(quote.number).padStart(4, "0")}`}
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: sc.dot }}
                />
                <span className="text-sm font-medium text-white/90">{sc.label}</span>
              </div>
              {respondedAt && (
                <p className="flex items-center gap-1 text-[10px] text-white/60">
                  <Clock className="size-2.5" />
                  {formatDateTime(respondedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <Hash className="size-3" />
              {`#${String(quote.number).padStart(4, "0")}`}
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
          <div className="px-7 py-5 border-b border-slate-100 print:px-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Para</p>
            <p className="font-bold text-slate-800 text-base">{client.name}</p>
            {client.company && <p className="text-sm text-slate-500 mt-0.5">{client.company}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
                  <Mail className="size-3" />{client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
                  <Phone className="size-3" />{client.phone}
                </a>
              )}
              {client.city && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="size-3" />{client.city}{client.state ? `, ${client.state}` : ""}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Itens */}
        <div className="px-7 py-6 border-b border-slate-100 print:px-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Itens</p>
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Nenhum item adicionado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th
                      className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wide text-white rounded-l-lg"
                      style={{ backgroundColor: accentColor }}
                    >
                      Descrição
                    </th>
                    <th
                      className="text-right py-2.5 px-3 text-[11px] font-bold uppercase tracking-wide text-white w-14"
                      style={{ backgroundColor: accentColor }}
                    >
                      Qtd
                    </th>
                    <th
                      className="text-right py-2.5 px-3 text-[11px] font-bold uppercase tracking-wide text-white w-24"
                      style={{ backgroundColor: accentColor }}
                    >
                      Unit.
                    </th>
                    <th
                      className="text-right py-2.5 px-3 text-[11px] font-bold uppercase tracking-wide text-white rounded-r-lg w-24"
                      style={{ backgroundColor: accentColor }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="py-2.5 px-3 text-slate-700 border-b border-slate-100">{item.description}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-b border-slate-100">
                        {Number(item.quantity).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-b border-slate-100">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900 border-b border-slate-100">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totais */}
          <div className="mt-5 flex justify-end">
            <div className="w-full max-w-xs flex flex-col gap-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              {Number(quote.discount) > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Desconto</span>
                  <span className="text-green-600 font-medium">- {formatCurrency(quote.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-200 pt-2.5 mt-1">
                <span className="font-bold text-slate-800 text-base">Total</span>
                <span className="font-black text-xl" style={{ color: accentColor }}>
                  {formatCurrency(quote.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Observações */}
        {quote.notes && (
          <div className="px-7 py-5 border-b border-slate-100 print:px-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Observações</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* ── Área de resposta do cliente ── */}
        {canRespond && (
          <div className="px-7 py-6 print:hidden" style={{ borderTop: `3px solid ${accentColor}` }}>

            {/* Estado: loading */}
            {step === "loading" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="size-10 animate-spin" style={{ color: accentColor }} strokeWidth={1.5} />
                <div className="text-center">
                  <p className="font-semibold text-slate-800">Processando sua resposta…</p>
                  <p className="text-sm text-slate-500 mt-1">Aguarde um instante</p>
                </div>
              </div>
            )}

            {/* Estado: aprovado */}
            {step === "done-accept" && (
              <div className="flex flex-col items-center gap-5 py-6 text-center">
                <div className="size-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                  <CheckCircle className="size-8 text-green-500" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">Orçamento aprovado!</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                    Ótimo! Sua confirmação foi registrada e uma ordem de serviço foi gerada automaticamente.
                  </p>
                  {respondedAt && (
                    <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-2">
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
                <div className="size-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
                  <XCircle className="size-8 text-red-500" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">Recusa registrada</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                    Agradecemos o retorno. O prestador receberá o motivo e poderá ajustar a proposta.
                  </p>
                  {respondedAt && (
                    <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-2">
                      <Clock className="size-3" />
                      {formatDateTime(respondedAt)}
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
                <div className="text-center pb-1">
                  <p className="font-bold text-slate-800 text-lg">O que você decide?</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Aceite para prosseguirmos ou recuse informando o motivo.
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAccept}
                    className="flex flex-col items-center gap-2 text-white font-semibold rounded-2xl px-4 py-5 transition-all active:scale-95 shadow-md"
                    style={{ backgroundColor: accentColor }}
                  >
                    <ThumbsUp className="size-7" strokeWidth={1.5} />
                    <span className="text-sm">Aceitar orçamento</span>
                  </button>
                  <button
                    onClick={() => { setStep("reject-form"); setError(null) }}
                    className="flex flex-col items-center gap-2 border-2 border-red-200 hover:bg-red-50 active:scale-95 text-red-500 font-semibold rounded-2xl px-4 py-5 transition-all bg-white"
                  >
                    <ThumbsDown className="size-7" strokeWidth={1.5} />
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
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors w-fit"
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar
                </button>

                <div>
                  <p className="font-bold text-slate-800 text-lg">Motivo da recusa</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Seu feedback ajuda o prestador a ajustar a proposta.
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: valor acima do esperado, prazo incompatível, preciso de ajustes nos itens…"
                  rows={4}
                  className="w-full rounded-xl border-2 border-slate-200 focus:border-red-300 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 resize-none focus:outline-none transition-colors bg-white"
                />

                <button
                  onClick={handleReject}
                  className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-semibold rounded-xl px-6 py-3.5 text-sm transition-all w-full shadow-sm"
                >
                  <XCircle className="size-4" />
                  Confirmar recusa
                </button>
              </div>
            )}
          </div>
        )}

        {/* Orçamento já respondido */}
        {!canRespond && (quote.status === "aprovado" || quote.status === "recusado") && (
          <div className="px-7 py-5 print:hidden print:px-6">
            {quote.status === "aprovado" ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-4">
                <CheckCircle className="size-5 text-green-500 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-semibold text-green-700">Orçamento aprovado</p>
                  <p className="text-xs text-slate-500 mt-0.5">Uma ordem de serviço foi gerada automaticamente.</p>
                  {alreadyRespondedAt && (
                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <Clock className="size-2.5" />
                      {formatDateTime(alreadyRespondedAt)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-4">
                <XCircle className="size-5 text-red-500 shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-semibold text-red-700">Orçamento recusado</p>
                  {(quote as Quote & { rejectionReason?: string }).rejectionReason && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Motivo: {(quote as Quote & { rejectionReason?: string }).rejectionReason}
                    </p>
                  )}
                  {alreadyRespondedAt && (
                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <Clock className="size-2.5" />
                      {formatDateTime(alreadyRespondedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 px-7 py-4 print:px-6">
          {branding.docFooter && (
            <p className="text-xs text-slate-600 text-center mb-2 leading-relaxed whitespace-pre-wrap">
              {branding.docFooter}
            </p>
          )}
          <p className="text-[11px] text-slate-400 text-center">
            Orçamento gerado por{" "}
            <span className="font-semibold text-slate-500">
              {branding.isPaid ? `${branding.name} via Elevanthe CRM` : "Elevanthe CRM"}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

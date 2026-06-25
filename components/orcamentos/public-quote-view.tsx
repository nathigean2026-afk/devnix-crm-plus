"use client"

import type { Client, Quote, QuoteItem } from "@/lib/db/schema"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MapPin, Mail, Phone, Calendar, Hash, Printer, MessageCircle, Send, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useState } from "react"
import { respondQuote } from "@/lib/actions"

interface PublicQuoteViewProps {
  quote: Quote
  client: Client | null
  items: QuoteItem[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  enviado: { label: "Aguardando aprovação", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  aprovado: { label: "Aprovado", color: "bg-green-500/15 text-green-400 border-green-500/20" },
  recusado: { label: "Recusado", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  cancelado: { label: "Cancelado", color: "bg-muted text-muted-foreground" },
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

export function PublicQuoteView({ quote, client, items }: PublicQuoteViewProps) {
  const sc = statusConfig[quote.status] ?? statusConfig.rascunho
  const [decision, setDecision] = useState<"aprovado" | "recusado" | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ type: "aprovado" | "recusado"; serviceOrderId?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Se o orçamento já foi respondido antes de carregar a página
  const alreadyAnswered = quote.status === "aprovado" || quote.status === "recusado"

  function handleShareWhatsApp() {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const phone = client?.phone?.replace(/\D/g, "") ?? ""
    const text = `Olá${client ? ` ${client.name}` : ""}! Segue seu orçamento *#${String(quote.number).padStart(4, "0")} — ${quote.title}*\nTotal: ${formatCurrency(quote.total)}\n\nAcesse: ${url}`
    window.open(phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  function handleShareTelegram() {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const text = `Orçamento #${String(quote.number).padStart(4, "0")}: ${quote.title} — ${formatCurrency(quote.total)}`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank")
  }

  function notifyProviderWhatsApp(type: "aprovado" | "recusado") {
    // Notifica o prestador via WhatsApp com link direto para a OS ou para o orçamento
    const url = typeof window !== "undefined" ? window.location.href : ""
    const clientName = client?.name ?? "Cliente"
    const quoteLabel = `#${String(quote.number).padStart(4, "0")} — ${quote.title}`
    const msg =
      type === "aprovado"
        ? `Boa notícia! O orçamento *${quoteLabel}* foi *APROVADO* por *${clientName}*.\n\nTotal: ${formatCurrency(quote.total)}\n\nAcesse o sistema para acompanhar a OS gerada automaticamente.`
        : `O orçamento *${quoteLabel}* foi *RECUSADO* por *${clientName}*${rejectionReason ? `.\n\nMotivo: "${rejectionReason}"` : "."}\n\nAcesse o orçamento para revisar: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")
  }

  async function handleAccept() {
    setLoading(true)
    setError(null)
    const result = await respondQuote(quote.id, "aprovado")
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? "Erro ao processar. Tente novamente.")
      return
    }
    setDecision("aprovado")
    setDone({ type: "aprovado", serviceOrderId: result.serviceOrderId })
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setError("Informe o motivo da recusa para que possamos melhorar o orçamento.")
      return
    }
    setLoading(true)
    setError(null)
    const result = await respondQuote(quote.id, "recusado", rejectionReason.trim())
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? "Erro ao processar. Tente novamente.")
      return
    }
    setDecision("recusado")
    setDone({ type: "recusado" })
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Barra de ações de compartilhamento */}
        <div className="flex items-center justify-end gap-2 mb-4 print:hidden">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 transition-colors font-medium"
          >
            <MessageCircle className="size-4" />WhatsApp
          </button>
          <button
            onClick={handleShareTelegram}
            className="flex items-center gap-2 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-lg px-4 py-2 transition-colors font-medium"
          >
            <Send className="size-4" />Telegram
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm border border-border hover:bg-muted text-foreground rounded-lg px-4 py-2 transition-colors font-medium"
          >
            <Printer className="size-4" />Imprimir / PDF
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20reduzida-B2qAbWz2qQ52LWM7e7hYbiRRWNXHqD.png"
              alt="Devnix"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <p className="font-bold text-foreground text-lg">Devnix CRM Plus</p>
              <p className="text-xs text-muted-foreground">Soluções Web Inteligentes</p>
            </div>
          </div>
          <Badge className={done ? statusConfig[done.type].color : sc.color}>
            {done ? statusConfig[done.type].label : sc.label}
          </Badge>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl">
          {/* Quote Header */}
          <div className="bg-primary/10 border-b border-border px-8 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground text-balance">{quote.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Hash className="size-3.5" />
                    {String(quote.number).padStart(4, "0")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    Emitido em {format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  {quote.validUntil && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      Válido até {format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Client Info */}
          {client && (
            <div className="px-8 py-5 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Para</p>
              <div className="flex flex-col gap-1.5">
                <p className="font-semibold text-foreground text-lg">{client.name}</p>
                {client.company && <p className="text-muted-foreground">{client.company}</p>}
                <div className="flex flex-wrap gap-4 mt-1">
                  {client.email && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="size-3.5" />{client.email}
                    </span>
                  )}
                  {client.phone && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="size-3.5" />{client.phone}
                    </span>
                  )}
                  {client.city && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />{client.city}{client.state ? `, ${client.state}` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="px-8 py-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Itens do Orçamento</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Descrição</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Qtd</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Preço Unit.</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                      <td className="px-4 py-3 text-sm text-foreground">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground text-right">{Number(item.quantity).toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex flex-col items-end gap-2 mt-5">
              <div className="w-full max-w-xs flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(quote.subtotal)}</span>
                </div>
                {Number(quote.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-red-400">- {formatCurrency(quote.discount)}</span>
                  </div>
                )}
                <Separator className="bg-border" />
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="px-8 py-5 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Observações</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* ── Bloco de resposta do cliente ── */}
          {!alreadyAnswered && (
            <div className="px-8 py-6 border-t border-border bg-muted/10 print:hidden">
              {!done ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Sua resposta</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Aceite o orçamento para prosseguirmos ou recuse informando o motivo.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                      <AlertCircle className="size-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  {!showRejectForm ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleAccept}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-lg px-6 py-3 transition-colors flex-1"
                      >
                        <CheckCircle className="size-5" />
                        {loading ? "Processando..." : "Aceitar Orçamento"}
                      </button>
                      <button
                        onClick={() => { setShowRejectForm(true); setError(null) }}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 border border-red-500/40 hover:bg-red-500/10 disabled:opacity-60 text-red-400 font-semibold rounded-lg px-6 py-3 transition-colors flex-1"
                      >
                        <XCircle className="size-5" />
                        Recusar Orçamento
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-foreground uppercase tracking-wide">
                          Motivo da recusa <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Ex: valor acima do esperado, prazo não compatível, preciso de ajustes nos itens..."
                          rows={3}
                          className="w-full bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleReject}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-lg px-6 py-3 transition-colors flex-1"
                        >
                          <XCircle className="size-5" />
                          {loading ? "Enviando..." : "Confirmar Recusa"}
                        </button>
                        <button
                          onClick={() => { setShowRejectForm(false); setError(null) }}
                          disabled={loading}
                          className="border border-border hover:bg-muted text-foreground rounded-lg px-4 py-3 transition-colors text-sm"
                        >
                          Voltar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Confirmação pós-resposta */
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  {done.type === "aprovado" ? (
                    <>
                      <div className="size-14 rounded-full bg-green-500/15 flex items-center justify-center">
                        <CheckCircle className="size-8 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-lg">Orçamento aprovado!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ótimo! Nosso time foi notificado e já vamos iniciar os preparativos.
                        </p>
                      </div>
                      <button
                        onClick={() => notifyProviderWhatsApp("aprovado")}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition-colors text-sm"
                      >
                        <MessageCircle className="size-4" />
                        Notificar prestador pelo WhatsApp
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="size-14 rounded-full bg-red-500/15 flex items-center justify-center">
                        <XCircle className="size-8 text-red-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-lg">Recusa registrada</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Agradecemos o seu retorno. O prestador receberá o motivo e poderá ajustar a proposta.
                        </p>
                      </div>
                      <button
                        onClick={() => notifyProviderWhatsApp("recusado")}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition-colors text-sm"
                      >
                        <MessageCircle className="size-4" />
                        Notificar prestador pelo WhatsApp
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Orçamento já respondido anteriormente — exibe motivo se recusado */}
          {alreadyAnswered && (
            <div className="px-8 py-5 border-t border-border print:hidden">
              {quote.status === "aprovado" ? (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                  <CheckCircle className="size-5 text-green-400 shrink-0" />
                  <p className="text-sm text-green-400 font-medium">Este orçamento foi aprovado.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="size-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-400 font-medium">Este orçamento foi recusado.</p>
                  </div>
                  {quote.rejectionReason && (
                    <p className="text-sm text-muted-foreground pl-7">
                      Motivo: {quote.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="bg-muted/20 border-t border-border px-8 py-4">
            <p className="text-xs text-muted-foreground text-center">
              Orçamento gerado por <span className="text-primary font-medium">Devnix CRM Plus</span> &bull; Soluções Web Inteligentes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

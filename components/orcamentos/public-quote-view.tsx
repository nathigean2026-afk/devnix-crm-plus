import type { Client, Quote, QuoteItem } from "@/lib/db/schema"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MapPin, Mail, Phone, Calendar, Hash } from "lucide-react"

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

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
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
          <Badge className={sc.color}>{sc.label}</Badge>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl">
          {/* Quote Header */}
          <div className="bg-primary/10 border-b border-border px-8 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground text-balance">{quote.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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

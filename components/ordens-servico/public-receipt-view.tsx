"use client"

import type { ServiceOrder, ServiceOrderItem, Client, BusinessProfile } from "@/lib/db/schema"
import Image from "next/image"
import { Building2, Phone, Mail, MapPin, Printer, CheckCircle2, MessageCircle, Send } from "lucide-react"

interface PublicReceiptViewProps {
  order: ServiceOrder & {
    items: ServiceOrderItem[]
    client: Client | null
    profile: BusinessProfile | null
  }
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

function formatDateLong(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ""
  const months = [
    "janeiro","fevereiro","março","abril","maio","junho",
    "julho","agosto","setembro","outubro","novembro","dezembro"
  ]
  return `${d.getUTCDate()} de ${months[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}

export function PublicReceiptView({ order }: PublicReceiptViewProps) {
  const profile = order.profile
  const client = order.client

  const handleShareWhatsApp = () => {
    const url = window.location.href
    const text = `Recibo do serviço: *${order.title}* — Total: ${formatCurrency(order.total)}\n\nAcesse: ${url}`
    const phone = client?.phone?.replace(/\D/g, "") ?? ""
    window.open(
      phone
        ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    )
  }

  const handleShareTelegram = () => {
    const url = window.location.href
    const text = `Recibo: ${order.title} — ${formatCurrency(order.total)}`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 print:py-0 print:px-0 print:bg-white">
      <div className="max-w-2xl mx-auto">

        {/* Botões de ação - apenas na tela */}
        <div className="flex items-center justify-end gap-2 mb-4 print:hidden">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 transition-colors font-medium"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </button>
          <button
            onClick={handleShareTelegram}
            className="flex items-center gap-2 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-lg px-4 py-2 transition-colors font-medium"
          >
            <Send className="size-4" />
            Telegram
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm border border-gray-300 hover:border-gray-500 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 transition-colors font-medium"
          >
            <Printer className="size-4" />
            Imprimir / PDF
          </button>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none">

          {/* Header verde de confirmação */}
          <div className="bg-emerald-600 px-8 py-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="size-8 text-white" />
              <div>
                <h1 className="text-xl font-bold">Recibo de Pagamento</h1>
                <p className="text-emerald-100 text-sm">Serviço realizado com sucesso</p>
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-emerald-200 text-xs uppercase tracking-wide">Número da OS</p>
                <p className="text-3xl font-bold tabular-nums">#{String(order.number).padStart(4, "0")}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-200 text-xs uppercase tracking-wide">Total Pago</p>
                <p className="text-3xl font-bold">{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 flex flex-col gap-6">

            {/* Prestador e Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-5 border-b border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Prestador de Serviços</p>
                <div className="flex items-start gap-3">
                  {profile?.logo ? (
                    <Image
                      src={profile.logo}
                      alt={profile.name ?? "Logo"}
                      width={40}
                      height={40}
                      style={{ width: 40, height: "auto" }}
                      className="object-contain rounded-md border border-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="size-10 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 className="size-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 text-sm">
                    <p className="font-semibold text-gray-900">{profile?.name || "Empresa"}</p>
                    {profile?.document && <p className="text-gray-500">{profile.document}</p>}
                    {profile?.phone && (
                      <p className="flex items-center gap-1.5 text-gray-500">
                        <Phone className="size-3 shrink-0" />{profile.phone}
                      </p>
                    )}
                    {profile?.email && (
                      <p className="flex items-center gap-1.5 text-gray-500">
                        <Mail className="size-3 shrink-0" />{profile.email}
                      </p>
                    )}
                    {profile?.city && (
                      <p className="flex items-center gap-1.5 text-gray-500">
                        <MapPin className="size-3 shrink-0" />{[profile.city, profile.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cliente</p>
                <div className="flex flex-col gap-1 text-sm">
                  <p className="font-semibold text-gray-900">{client?.name || "—"}</p>
                  {client?.document && <p className="text-gray-500">{client.document}</p>}
                  {client?.phone && (
                    <p className="flex items-center gap-1.5 text-gray-500">
                      <Phone className="size-3 shrink-0" />{client.phone}
                    </p>
                  )}
                  {client?.email && (
                    <p className="flex items-center gap-1.5 text-gray-500">
                      <Mail className="size-3 shrink-0" />{client.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Serviço e Data */}
            <div className="pb-5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Serviço Prestado</p>
              <h2 className="text-lg font-bold text-gray-900">{order.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5" suppressHydrationWarning>
                Emitido em {formatDateLong(order.createdAt)}
              </p>
            </div>

            {/* Itens */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Itens</p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Descrição</th>
                      <th className="text-center py-2.5 px-3 text-gray-500 font-medium w-12">Qtd</th>
                      <th className="text-right py-2.5 px-4 text-gray-500 font-medium w-28">Unit.</th>
                      <th className="text-right py-2.5 px-4 text-gray-500 font-medium w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, i) => (
                      <tr key={item.id} className={`border-t border-gray-100 ${i % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                        <td className="py-3 px-4 text-gray-800">{item.description}</td>
                        <td className="py-3 px-3 text-center text-gray-600">{Number(item.quantity)}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totais */}
            <div className="flex flex-col items-end gap-2">
              <div className="w-full max-w-xs flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Desconto</span>
                    <span className="text-red-500">- {formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 pt-2 mt-1">
                  <span>Total Pago</span>
                  <span className="text-emerald-600">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Observações */}
            {order.notes && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Observações</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}

            {/* Rodapé */}
            <div className="border-t border-gray-100 pt-4 text-center">
              <p className="text-xs text-gray-400">
                Recibo gerado por <span className="font-medium text-emerald-600">{profile?.name || "Devnix CRM Plus"}</span>
                {profile?.email && <> &bull; {profile.email}</>}
              </p>
              <p className="text-xs text-gray-300 mt-1">Este documento serve como comprovante de prestação de serviço</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

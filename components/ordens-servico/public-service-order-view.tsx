"use client"

import { useEffect, useRef } from "react"
import type { ServiceOrder, ServiceOrderItem, Client, BusinessProfile } from "@/lib/db/schema"
import Image from "next/image"
import QRCode from "qrcode"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Building2, Phone, Mail, Globe, MapPin, QrCode, Printer } from "lucide-react"

interface PublicServiceOrderViewProps {
  order: ServiceOrder & {
    items: ServiceOrderItem[]
    client: Client | null
    profile: BusinessProfile | null
  }
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

function buildPixPayload(pixKey: string, pixType: string, name: string, amount: number): string {
  function field(id: string, value: string) {
    const len = value.length.toString().padStart(2, "0")
    return `${id}${len}${value}`
  }
  const merchantAccountInfo = field("00", "BR.GOV.BCB.PIX") + field("01", pixKey)
  const merchantAccount = field("26", merchantAccountInfo)
  const merchantName = name.slice(0, 25).replace(/[^A-Za-z0-9 ]/g, "")
  const amountStr = amount > 0 ? amount.toFixed(2) : ""

  let payload =
    field("00", "01") +
    merchantAccount +
    field("52", "0000") +
    field("53", "986") +
    (amountStr ? field("54", amountStr) : "") +
    field("58", "BR") +
    field("59", merchantName || "RECEBEDOR") +
    field("60", "SAO PAULO") +
    field("62", field("05", "***"))

  // CRC16
  payload += "6304"
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    }
  }
  return payload + (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0")
}

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  "em-andamento": "Em Andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
}

export function PublicServiceOrderView({ order }: PublicServiceOrderViewProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const profile = order.profile
  const client = order.client

  const pixKey = order.pixKey || profile?.pixKey
  const pixType = order.pixType || profile?.pixType || "cpf"
  const pixName = profile?.name || "RECEBEDOR"

  useEffect(() => {
    if (!pixKey || !qrCanvasRef.current) return
    const payload = buildPixPayload(pixKey, pixType, pixName, Number(order.total))
    QRCode.toCanvas(qrCanvasRef.current, payload, { width: 200, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
  }, [pixKey, pixType, pixName, order.total])

  const discountExpiry = order.discountExpiry
    ? format(new Date(order.discountExpiry), "dd/MM/yyyy", { locale: ptBR })
    : null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none">

        {/* Header */}
        <div className="bg-gray-900 text-white px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {profile?.logo ? (
                <Image
                  src={profile.logo}
                  alt={profile.name ?? "Logo"}
                  width={56}
                  height={56}
                  style={{ width: 56, height: "auto" }}
                  className="object-contain rounded-md bg-white p-1"
                />
              ) : (
                <div className="size-14 rounded-md bg-white/10 flex items-center justify-center">
                  <Building2 className="size-7 text-white/60" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{profile?.name || "Empresa"}</h1>
                {profile?.document && <p className="text-sm text-gray-400">{profile.document}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Ordem de Serviço</p>
              <p className="text-2xl font-bold">#{String(order.number).padStart(4, "0")}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded mt-1 font-medium ${
                order.status === "concluido" ? "bg-green-500/20 text-green-300" :
                order.status === "em-andamento" ? "bg-yellow-500/20 text-yellow-300" :
                order.status === "cancelado" ? "bg-red-500/20 text-red-300" :
                "bg-blue-500/20 text-blue-300"
              }`}>
                {statusLabels[order.status] ?? order.status}
              </span>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 flex flex-col gap-6">

          {/* Empresa e Cliente */}
          <div className="grid grid-cols-2 gap-6">
            {/* Empresa */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Prestador</p>
              <div className="flex flex-col gap-1 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{profile?.name || "—"}</p>
                {profile?.phone && (
                  <p className="flex items-center gap-1 text-gray-500">
                    <Phone className="size-3" />{profile.phone}
                  </p>
                )}
                {profile?.email && (
                  <p className="flex items-center gap-1 text-gray-500">
                    <Mail className="size-3" />{profile.email}
                  </p>
                )}
                {profile?.website && (
                  <p className="flex items-center gap-1 text-gray-500">
                    <Globe className="size-3" />{profile.website}
                  </p>
                )}
                {(profile?.address || profile?.city) && (
                  <p className="flex items-center gap-1 text-gray-500">
                    <MapPin className="size-3" />
                    {[profile.address, profile.city, profile.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
            {/* Cliente */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cliente</p>
              <div className="flex flex-col gap-1 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{client?.name || "—"}</p>
                {client?.document && <p className="text-gray-500">{client.document}</p>}
                {client?.phone && (
                  <p className="flex items-center gap-1 text-gray-500">
                    <Phone className="size-3" />{client.phone}
                  </p>
                )}
                {client?.email && (
                  <p className="flex items-center gap-1 text-gray-500">
                    <Mail className="size-3" />{client.email}
                  </p>
                )}
                {(client?.address || client?.city) && (
                  <p className="flex items-center gap-1 text-gray-500">
                    <MapPin className="size-3" />
                    {[client.address, client.city, client.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Título e Data */}
          <div className="border-t border-gray-100 pt-4">
            <h2 className="text-lg font-bold text-gray-900">{order.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Emitida em {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          {/* Itens */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Descrição</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium w-16">Qtd</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium w-28">Unit.</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="py-2 px-3 text-gray-700">{item.description}</td>
                    <td className="py-2 px-3 text-center text-gray-600">{Number(item.quantity)}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-800">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totais + QR */}
          <div className="flex flex-col sm:flex-row gap-6 items-start justify-between border-t border-gray-100 pt-4">
            {/* Totais */}
            <div className="flex flex-col gap-2 flex-1 max-w-xs">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Desconto{discountExpiry ? ` (válido até ${discountExpiry})` : ""}</span>
                  <span className="text-red-500">- {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-200 pt-2 mt-1">
                <span>Total</span>
                <span className="text-blue-700">{formatCurrency(order.total)}</span>
              </div>
              {order.cashPrice && (
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-600">A vista</span>
                  <span className="text-green-600 font-bold">{formatCurrency(order.cashPrice)}</span>
                </div>
              )}
              {order.cardPrice && (
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-600">
                    Cartão {Number(order.cardInstallments) > 1 ? `(${order.cardInstallments}x)` : ""}
                  </span>
                  <span className="text-blue-600 font-bold">
                    {Number(order.cardInstallments) > 1
                      ? `${order.cardInstallments}x de ${formatCurrency(Number(order.cardPrice) / Number(order.cardInstallments))}`
                      : formatCurrency(order.cardPrice)
                    }
                  </span>
                </div>
              )}
            </div>

            {/* QR Code Pix */}
            {pixKey && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <QrCode className="size-4" />
                  Pagar com Pix
                </div>
                <div className="border-2 border-green-300 rounded-xl p-2 bg-white">
                  <canvas ref={qrCanvasRef} />
                </div>
                <p className="text-xs text-gray-500 text-center max-w-[180px]">
                  Aponte a câmera para pagar {formatCurrency(order.total)} via Pix
                </p>
                <p className="text-xs text-gray-400 font-mono text-center break-all max-w-[200px]">
                  {pixKey}
                </p>
              </div>
            )}
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Observações</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Botão imprimir */}
          <div className="flex justify-end print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-md px-4 py-2 transition-colors"
            >
              <Printer className="size-4" />
              Imprimir / Salvar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

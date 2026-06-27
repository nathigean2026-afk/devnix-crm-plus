"use client"

import { useEffect, useRef, useState } from "react"
import type { ServiceOrder, ServiceOrderItem, Client, BusinessProfile } from "@/lib/db/schema"
import Image from "next/image"
import QRCode from "qrcode"
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

// Formata data sem usar date-fns para evitar hydration mismatch
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ""
  const day = String(d.getUTCDate()).padStart(2, "0")
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}

function formatDateLong(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ""
  const months = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]
  return `${d.getUTCDate()} de ${months[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}

// Remove acentos e caracteres especiais — crítico para o payload Pix
function sanitizePix(str: string, max: number): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, max)
}

// Remove tudo que não seja letra, número e os separadores permitidos no campo 01
function cleanPixKey(key: string): string {
  const k = key.trim()
  // E-mail: mantém como está
  if (k.includes("@")) return k
  // Chave aleatória (UUID): mantém como está
  if (/^[0-9a-f-]{36}$/i.test(k)) return k
  // Telefone: mantém apenas +, dígitos
  if (k.startsWith("+")) return k.replace(/[^\d+]/g, "")
  // CPF/CNPJ: mantém apenas dígitos
  return k.replace(/\D/g, "")
}

// Gera payload EMV Pix válido (Banco Central do Brasil)
function buildPixPayload(pixKey: string, name: string, city: string, amount: number): string {
  const cleanKey = cleanPixKey(pixKey)

  function tlv(id: string, value: string): string {
    const len = String(value.length).padStart(2, "0")
    return `${id}${len}${value}`
  }

  const mai = tlv("00", "BR.GOV.BCB.PIX") + tlv("01", cleanKey)
  const merchantName = sanitizePix(name || "RECEBEDOR", 25)
  const merchantCity = sanitizePix(city || "BRASIL", 15)
  const amountStr = amount > 0 ? amount.toFixed(2) : ""

  let payload =
    tlv("00", "01") +
    tlv("26", mai) +
    tlv("52", "0000") +
    tlv("53", "986") +
    (amountStr ? tlv("54", amountStr) : "") +
    tlv("58", "BR") +
    tlv("59", merchantName) +
    tlv("60", merchantCity) +
    tlv("62", tlv("05", "***"))

  payload += "6304"

  // CRC16-CCITT (XMODEM)
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8)
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }

  return payload + crc.toString(16).toUpperCase().padStart(4, "0")
}

const statusLabels: Record<string, { label: string; cls: string }> = {
  aberto: { label: "Aberto", cls: "bg-blue-500/20 text-blue-300" },
  "em-andamento": { label: "Em Andamento", cls: "bg-yellow-500/20 text-yellow-300" },
  concluido: { label: "Concluído", cls: "bg-green-500/20 text-green-300" },
  cancelado: { label: "Cancelado", cls: "bg-red-500/20 text-red-300" },
}

/** Retorna dados de branding: usa dados da empresa se plano Business/Enterprise e campos preenchidos;
 *  caso contrário usa padrão Elevanthe. */
function getBranding(profile: BusinessProfile | null | undefined) {
  const isPaid = profile?.licensePlan === "business" || profile?.licensePlan === "enterprise"
  return {
    name:     (isPaid && profile?.name)     ? profile.name     : "Elevanthe CRM",
    logo:     (isPaid && profile?.logo)     ? profile.logo     : "/elevanthe-icon.png",
    document: (isPaid && profile?.document) ? profile.document : null,
    phone:    (isPaid && profile?.phone)    ? profile.phone    : null,
    email:    (isPaid && profile?.email)    ? profile.email    : null,
    address:  (isPaid && profile?.address)  ? profile.address  : null,
    city:     (isPaid && profile?.city)     ? profile.city     : null,
    state:    (isPaid && profile?.state)    ? profile.state    : null,
    website:  (isPaid && profile?.website)  ? profile.website  : null,
    isPaid,
  }
}

export function PublicServiceOrderView({ order }: PublicServiceOrderViewProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [pixPayload, setPixPayload] = useState("")
  const [qrError, setQrError] = useState(false)
  const profile = order.profile
  const client = order.client
  const branding = getBranding(profile)

  const pixKey = order.pixKey || profile?.pixKey || ""
  const pixName = profile?.name || "RECEBEDOR"
  const pixCity = profile?.city || "BRASIL"
  const statusInfo = statusLabels[order.status] ?? statusLabels.aberto

  useEffect(() => {
    if (!pixKey || !qrCanvasRef.current) return
    try {
      const payload = buildPixPayload(pixKey, pixName, pixCity, Number(order.total))
      setPixPayload(payload)
      QRCode.toCanvas(qrCanvasRef.current, payload, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      })
    } catch {
      setQrError(true)
    }
  }, [pixKey, pixName, pixCity, order.total])

  const discountExpiry = formatDate(order.discountExpiry)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:py-0 print:px-0 print:bg-white">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none">

        {/* Header */}
        <div className="bg-gray-900 text-white px-8 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Image
                src={branding.logo}
                alt={branding.name}
                width={56}
                height={56}
                style={{ width: 56, height: "auto" }}
                className="object-contain rounded-md bg-white p-1 shrink-0"
              />
              <div>
                <h1 className="text-xl font-bold leading-tight">{branding.name}</h1>
                {branding.document && <p className="text-sm text-gray-400 mt-0.5">{branding.document}</p>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Ordem de Serviço</p>
              <p className="text-3xl font-bold tabular-nums">#{String(order.number).padStart(4, "0")}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded mt-1 font-medium ${statusInfo.cls}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 flex flex-col gap-6">

          {/* Empresa e Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Prestador</p>
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-semibold text-gray-900">{branding.name}</p>
                {branding.phone && <p className="flex items-center gap-1.5 text-gray-500"><Phone className="size-3 shrink-0" />{branding.phone}</p>}
                {branding.email && <p className="flex items-center gap-1.5 text-gray-500"><Mail className="size-3 shrink-0" />{branding.email}</p>}
                {branding.website && <p className="flex items-center gap-1.5 text-gray-500"><Globe className="size-3 shrink-0" />{branding.website}</p>}
                {(branding.address || branding.city) && (
                  <p className="flex items-center gap-1.5 text-gray-500">
                    <MapPin className="size-3 shrink-0" />
                    {[branding.address, branding.city, branding.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cliente</p>
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-semibold text-gray-900">{client?.name || "—"}</p>
                {client?.document && <p className="text-gray-500">{client.document}</p>}
                {client?.phone && <p className="flex items-center gap-1.5 text-gray-500"><Phone className="size-3 shrink-0" />{client.phone}</p>}
                {client?.email && <p className="flex items-center gap-1.5 text-gray-500"><Mail className="size-3 shrink-0" />{client.email}</p>}
                {(client?.address || client?.city) && (
                  <p className="flex items-center gap-1.5 text-gray-500">
                    <MapPin className="size-3 shrink-0" />
                    {[client.address, client.city, client.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Título e Data */}
          <div className="border-t border-gray-100 pt-4">
            <h2 className="text-lg font-bold text-gray-900">{order.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5" suppressHydrationWarning>
              Emitida em {formatDateLong(order.createdAt)}
            </p>
          </div>

          {/* Itens */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="text-left py-2.5 px-3 text-gray-500 font-medium">Descrição</th>
                  <th className="text-center py-2.5 px-3 text-gray-500 font-medium w-14">Qtd</th>
                  <th className="text-right py-2.5 px-3 text-gray-500 font-medium w-28">Unit.</th>
                  <th className="text-right py-2.5 px-3 text-gray-500 font-medium w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                    <td className="py-2.5 px-3 text-gray-700">{item.description}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{Number(item.quantity)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totais + QR */}
          <div className="flex flex-col sm:flex-row gap-8 items-start border-t border-gray-100 pt-4">
            {/* Totais */}
            <div className="flex flex-col gap-2 flex-1 min-w-0 max-w-xs">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span suppressHydrationWarning>
                    Desconto{discountExpiry ? ` (válido até ${discountExpiry})` : ""}
                  </span>
                  <span className="text-red-500 font-medium">- {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-200 pt-2 mt-1">
                <span>Total</span>
                <span className="text-blue-700">{formatCurrency(order.total)}</span>
              </div>
              {order.cashPrice && Number(order.cashPrice) > 0 && (
                <div className="flex justify-between text-sm font-medium mt-1">
                  <span className="text-gray-600">À vista</span>
                  <span className="text-green-600 font-bold">{formatCurrency(order.cashPrice)}</span>
                </div>
              )}
              {order.cardPrice && Number(order.cardPrice) > 0 && (
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-600">
                    Cartão{Number(order.cardInstallments) > 1 ? ` (${order.cardInstallments}x)` : ""}
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
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <QrCode className="size-4 text-green-600" />
                  Pagar com Pix
                </div>
                <div className="border-2 border-green-400 rounded-xl p-2 bg-white shadow-sm">
                  {qrError ? (
                    <div className="w-[200px] h-[200px] flex items-center justify-center text-xs text-gray-400 text-center px-4">
                      Erro ao gerar QR Code. Verifique a chave Pix.
                    </div>
                  ) : (
                    <canvas ref={qrCanvasRef} />
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center max-w-[200px]">
                  Aponte a câmera para pagar <span className="font-semibold">{formatCurrency(order.total)}</span> via Pix
                </p>
                <p className="text-[11px] text-gray-400 font-mono text-center break-all max-w-[200px]">
                  {pixKey}
                </p>
                {/* Copia e cola */}
                {pixPayload && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixPayload)
                      alert("Código Pix copiado!")
                    }}
                    className="text-xs text-blue-600 underline hover:text-blue-800 print:hidden"
                  >
                    Copiar código Pix
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Observações</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Botões de ação — apenas imprimir/PDF visível ao cliente */}
          <div className="flex items-center justify-end gap-2 pt-2 flex-wrap print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 rounded-lg px-4 py-2 transition-colors"
            >
              <Printer className="size-4" />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-8 py-4 text-center">
          <p className="text-xs text-gray-400">
            Ordem de Serviço gerada por{" "}
            <span className="font-semibold text-gray-600">
              {branding.isPaid ? `${branding.name} via Elevanthe CRM` : "Elevanthe CRM"}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

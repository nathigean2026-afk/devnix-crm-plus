"use client"

import { useEffect, useRef, useState } from "react"
import type { ServiceOrder, ServiceOrderItem, Client, BusinessProfile } from "@/lib/db/schema"
import Image from "next/image"
import QRCode from "qrcode"
import { Building2, Phone, Mail, Globe, MapPin, QrCode, Printer, MessageCircle } from "lucide-react"

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

function cleanPixKey(key: string): string {
  const k = key.trim()
  if (k.includes("@")) return k
  if (/^[0-9a-f-]{36}$/i.test(k)) return k
  if (k.startsWith("+")) return k.replace(/[^\d+]/g, "")
  return k.replace(/\D/g, "")
}

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

const statusLabels: Record<string, { label: string; dot: string }> = {
  aberto:         { label: "Aberto",       dot: "#3b82f6" },
  "em-andamento": { label: "Em Andamento", dot: "#f59e0b" },
  concluido:      { label: "Concluído",    dot: "#22c55e" },
  cancelado:      { label: "Cancelado",    dot: "#ef4444" },
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

export function PublicServiceOrderView({ order }: PublicServiceOrderViewProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [pixPayload, setPixPayload] = useState("")
  const [qrError, setQrError] = useState(false)
  const [copied, setCopied] = useState(false)
  const profile = order.profile
  const client = order.client
  const branding = getBranding(profile)

  const pixKey = order.pixKey || profile?.pixKey || ""
  const pixName = profile?.name || "RECEBEDOR"
  const pixCity = profile?.city || "BRASIL"
  const statusInfo = statusLabels[order.status] ?? statusLabels.aberto
  const accentColor = branding.accentColor

  useEffect(() => {
    if (!pixKey || !qrCanvasRef.current) return
    try {
      const payload = buildPixPayload(pixKey, pixName, pixCity, Number(order.total))
      setPixPayload(payload)
      QRCode.toCanvas(qrCanvasRef.current, payload, {
        width: 180,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      })
    } catch {
      setQrError(true)
    }
  }, [pixKey, pixName, pixCity, order.total])

  async function handleCopyPix() {
    if (!pixPayload) return
    await navigator.clipboard.writeText(pixPayload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const url = window.location.href
    const clientName = client?.name ?? "Cliente"
    const docNum = `#${String(order.number).padStart(4, "0")}`
    const text = `Olá${client ? ` ${clientName}` : ""}! Aqui está sua Ordem de Serviço *${docNum} — ${order.title}*\nTotal: ${formatCurrency(order.total)}\n\n${url}`
    const phone = client?.phone?.replace(/\D/g, "") ?? ""
    window.open(
      phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    )
  }

  const discountExpiry = formatDate(order.discountExpiry)

  return (
    <div className="min-h-screen bg-[#f1f5f9] py-8 px-4 print:py-0 print:px-0 print:bg-white font-sans">
      {/* Barra de ações */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-5 print:hidden">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Building2 className="size-4" />
          <span>Ordem de Serviço {`#${String(order.number).padStart(4, "0")}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={shareWhatsApp}
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
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Card do documento */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">

        {/* ── Header com cor de destaque ── */}
        <div className="px-8 py-7 text-white print:px-6" style={{ backgroundColor: accentColor }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="size-20 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                <Image
                  src={branding.logo}
                  alt={branding.name}
                  width={80}
                  height={80}
                  style={{ width: 80, height: "auto" }}
                  className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-0.5">Prestador</p>
                <h1 className="text-xl font-bold leading-tight">{branding.name}</h1>
                {branding.document && (
                  <p className="text-white/60 text-xs mt-0.5">{branding.document}</p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Ordem de Serviço</p>
              <p className="text-4xl font-black tabular-nums leading-none">
                {`#${String(order.number).padStart(4, "0")}`}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-2">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: statusInfo.dot }}
                />
                <span className="text-sm font-medium text-white/90">{statusInfo.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-7 flex flex-col gap-7 print:px-6 print:py-5">

          {/* Prestador + Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">De</p>
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-semibold text-slate-800">{branding.name}</p>
                {branding.phone && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="size-3 shrink-0" />{branding.phone}
                  </p>
                )}
                {branding.email && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="size-3 shrink-0" />{branding.email}
                  </p>
                )}
                {branding.website && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Globe className="size-3 shrink-0" />{branding.website}
                  </p>
                )}
                {(branding.address || branding.city) && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="size-3 shrink-0" />
                    {[branding.address, branding.city, branding.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Para</p>
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-semibold text-slate-800">{client?.name || "—"}</p>
                {client?.document && <p className="text-slate-500">{client.document}</p>}
                {client?.phone && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="size-3 shrink-0" />{client.phone}
                  </p>
                )}
                {client?.email && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="size-3 shrink-0" />{client.email}
                  </p>
                )}
                {(client?.address || client?.city) && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="size-3 shrink-0" />
                    {[client?.address, client?.city, client?.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Título + data */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-900">{order.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5" suppressHydrationWarning>
              Emitida em {formatDateLong(order.createdAt)}
            </p>
          </div>

          {/* Itens */}
          <div className="overflow-x-auto -mx-8 px-8 print:-mx-6 print:px-6">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th
                    className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-wide text-white rounded-l-lg"
                    style={{ backgroundColor: accentColor }}
                  >
                    Descrição
                  </th>
                  <th
                    className="text-center py-3 px-4 text-[11px] font-bold uppercase tracking-wide text-white w-16"
                    style={{ backgroundColor: accentColor }}
                  >
                    Qtd
                  </th>
                  <th
                    className="text-right py-3 px-4 text-[11px] font-bold uppercase tracking-wide text-white w-28"
                    style={{ backgroundColor: accentColor }}
                  >
                    Unit.
                  </th>
                  <th
                    className="text-right py-3 px-4 text-[11px] font-bold uppercase tracking-wide text-white rounded-r-lg w-28"
                    style={{ backgroundColor: accentColor }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="py-3 px-4 text-slate-700 border-b border-slate-100">{item.description}</td>
                    <td className="py-3 px-4 text-center text-slate-600 border-b border-slate-100">{Number(item.quantity)}</td>
                    <td className="py-3 px-4 text-right text-slate-600 border-b border-slate-100">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 border-b border-slate-100">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totais + QR */}
          <div className="flex flex-col sm:flex-row gap-8 items-start border-t border-slate-100 pt-4">
            {/* Totais */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-0 max-w-xs">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span suppressHydrationWarning>
                    Desconto{discountExpiry ? ` (válido até ${discountExpiry})` : ""}
                  </span>
                  <span className="text-red-500 font-medium">- {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-2.5 mt-1">
                <span>Total</span>
                <span style={{ color: accentColor }}>{formatCurrency(order.total)}</span>
              </div>
              {order.cashPrice && Number(order.cashPrice) > 0 && (
                <div className="flex justify-between text-sm font-medium mt-1 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
                  <span className="text-slate-600">Pagamento à vista</span>
                  <span className="text-green-700 font-bold">{formatCurrency(order.cashPrice)}</span>
                </div>
              )}
              {order.cardPrice && Number(order.cardPrice) > 0 && (
                <div className="flex justify-between text-sm font-medium rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                  <span className="text-slate-600">
                    Cartão{Number(order.cardInstallments) > 1 ? ` (${order.cardInstallments}x)` : ""}
                  </span>
                  <span className="text-blue-700 font-bold">
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
              <div className="flex flex-col items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <QrCode className="size-4 text-green-600" />
                  Pagar com Pix
                </div>
                <div className="border-2 border-green-300 rounded-2xl p-3 bg-white shadow-sm">
                  {qrError ? (
                    <div className="w-[180px] h-[180px] flex items-center justify-center text-xs text-slate-400 text-center px-4">
                      Erro ao gerar QR Code. Verifique a chave Pix.
                    </div>
                  ) : (
                    <canvas ref={qrCanvasRef} className="rounded-lg" />
                  )}
                </div>
                <p className="text-xs text-slate-500 text-center max-w-[180px]">
                  Aponte a câmera para pagar{" "}
                  <span className="font-semibold">{formatCurrency(order.total)}</span> via Pix
                </p>
                <p className="text-[10px] text-slate-400 font-mono text-center break-all max-w-[180px]">
                  {pixKey}
                </p>
                {pixPayload && (
                  <button
                    onClick={handleCopyPix}
                    className="text-xs font-medium text-white rounded-lg px-4 py-1.5 transition-all active:scale-95 print:hidden"
                    style={{ backgroundColor: accentColor }}
                  >
                    {copied ? "Copiado!" : "Copiar código Pix"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Observações</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-8 py-4 print:px-6">
          {branding.docFooter && (
            <p className="text-xs text-slate-600 text-center mb-2 leading-relaxed whitespace-pre-wrap">
              {branding.docFooter}
            </p>
          )}
          <p className="text-[11px] text-slate-400 text-center">
            Ordem de Serviço gerada por{" "}
            <span className="font-semibold text-slate-500">
              {branding.isPaid ? `${branding.name} via Elevanthe CRM` : "Elevanthe CRM"}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

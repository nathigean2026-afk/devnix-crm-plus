"use client"

import { useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Copy, CheckCircle2, Loader2, RefreshCw, X, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface PixCheckoutModalProps {
  open: boolean
  onClose: () => void
  planId: string
  planName: string
  planPrice: string
}

type PixState = "loading" | "ready" | "polling" | "approved" | "error"

export function PixCheckoutModal({ open, onClose, planId, planName, planPrice }: PixCheckoutModalProps) {
  const router = useRouter()
  const [state, setState] = useState<PixState>("loading")
  const [qrCode, setQrCode] = useState<string>("")
  const [paymentId, setPaymentId] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const generatePix = useCallback(async () => {
    setState("loading")
    setQrCode("")
    setPaymentId("")
    try {
      const res = await fetch("/api/mercadopago/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro ao gerar Pix")
      setQrCode(data.qrCode ?? "")
      setPaymentId(String(data.paymentId))
      setState("ready")
    } catch {
      setState("error")
    }
  }, [planId])

  useEffect(() => {
    if (open) generatePix()
  }, [open, generatePix])

  // Polling a cada 5s apos ter o paymentId
  useEffect(() => {
    if (!paymentId || state === "loading" || state === "approved" || state === "error") return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mercadopago/status?id=${paymentId}`)
        const data = await res.json()
        if (data.status === "approved") {
          setState("approved")
          clearInterval(interval)
          toast.success("Pagamento aprovado! Ativando sua licença...")
          setTimeout(() => { router.push("/planos/sucesso"); router.refresh() }, 1500)
        } else if (data.status === "rejected" || data.status === "cancelled") {
          setState("error")
          clearInterval(interval)
        }
      } catch { /* silencioso */ }
    }, 5000)
    return () => clearInterval(interval)
  }, [paymentId, state, router])

  function handleCopy() {
    if (!qrCode) return
    navigator.clipboard.writeText(qrCode)
    setCopied(true)
    toast.success("Código Pix copiado!")
    setTimeout(() => setCopied(false), 3000)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-green-500/15 border border-green-500/25 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 512 512" className="size-4 text-green-400" fill="currentColor">
                <path d="M242.4 292.5C247.8 287.1 255.1 284.3 262.5 284.3C269.8 284.3 277.2 287.1 282.6 292.5L371.1 381C377.6 387.5 377.6 397.9 371.1 404.4L282.6 492.9C277.2 498.3 269.8 501.1 262.5 501.1C255.1 501.1 247.8 498.3 242.4 492.9L153.9 404.4C147.4 397.9 147.4 387.5 153.9 381L242.4 292.5zM242.4 19.03C247.8 13.63 255.1 10.82 262.5 10.82C269.8 10.82 277.2 13.63 282.6 19.03L371.1 107.5C377.6 114 377.6 124.4 371.1 130.9L282.6 219.4C277.2 224.8 269.8 227.6 262.5 227.6C255.1 227.6 247.8 224.8 242.4 219.4L153.9 130.9C147.4 124.4 147.4 114 153.9 107.5L242.4 19.03zM19.03 129.4C24.43 124 31.8 121.2 39.13 121.2C46.46 121.2 53.8 124 59.2 129.4L147.7 217.9C154.2 224.4 154.2 234.8 147.7 241.3L59.2 329.8C53.8 335.2 46.46 338 39.13 338C31.8 338 24.43 335.2 19.03 329.8L-69.47 241.3C-75.97 234.8 -75.97 224.4 -69.47 217.9L19.03 129.4zM465.9 129.4C471.3 124 478.7 121.2 486 121.2C493.3 121.2 500.7 124 506.1 129.4L594.6 217.9C601.1 224.4 601.1 234.8 594.6 241.3L506.1 329.8C500.7 335.2 493.3 338 486 338C478.7 338 471.3 335.2 465.9 329.8L377.4 241.3C370.9 234.8 370.9 224.4 377.4 217.9L465.9 129.4z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">Pagar com Pix</p>
              <p className="text-xs text-muted-foreground leading-tight">Mercado Pago</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Resumo do plano */}
        <div className="mx-5 mt-4 rounded-lg bg-muted/20 border border-border px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Plano selecionado</p>
            <p className="text-sm font-semibold text-foreground">{planName}</p>
          </div>
          <span className="text-lg font-bold text-green-400">{planPrice}</span>
        </div>

        {/* Conteudo */}
        <div className="px-5 py-4">

          {/* Loading */}
          {state === "loading" && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="size-12 rounded-full border-2 border-border border-t-green-400 animate-spin" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          )}

          {/* Erro */}
          {state === "error" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="size-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <X className="size-6 text-destructive" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Nao foi possivel gerar o Pix</p>
                <p className="text-xs text-muted-foreground mt-1">Verifique sua conexao e tente novamente.</p>
              </div>
              <Button variant="outline" size="sm" onClick={generatePix} className="gap-2">
                <RefreshCw className="size-3.5" />
                Tentar novamente
              </Button>
            </div>
          )}

          {/* QR Code */}
          {(state === "ready" || state === "polling") && qrCode && (
            <div className="flex flex-col items-center gap-4">
              {/* QR Code SVG gerado no cliente */}
              <div className="rounded-2xl border border-border bg-white p-4 shadow-lg">
                <QRCodeSVG
                  value={qrCode}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Abra o app do seu banco, escolha Pix e escaneie o QR Code
              </p>

              {/* Copia e cola */}
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-2">Ou use o código Pix Copia e Cola:</p>
                <div className="flex gap-2 items-stretch">
                  <div className="flex-1 min-w-0 bg-muted/30 border border-border rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground font-mono truncate">{qrCode}</p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 px-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors flex items-center gap-1.5"
                  >
                    {copied
                      ? <CheckCircle2 className="size-4 text-green-400" />
                      : <Copy className="size-4 text-muted-foreground" />
                    }
                    <span className="text-xs text-muted-foreground">{copied ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="w-full rounded-lg bg-green-500/5 border border-green-500/15 px-3 py-2.5 flex items-center gap-2.5">
                <Loader2 className="size-4 text-green-400 animate-spin shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Aguardando confirmação do pagamento...
                </p>
              </div>
            </div>
          )}

          {/* Aprovado */}
          {state === "approved" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="size-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="size-9 text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground">Pagamento confirmado!</p>
                <p className="text-sm text-muted-foreground mt-1">Ativando sua licença...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground/60">
            Pagamento seguro processado pelo Mercado Pago
          </p>
        </div>
      </div>
    </div>
  )
}

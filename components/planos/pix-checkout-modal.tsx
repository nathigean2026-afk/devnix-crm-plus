"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, CheckCircle, Loader2, RefreshCw } from "lucide-react"
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
  const [qrCodeBase64, setQrCodeBase64] = useState<string>("")
  const [paymentId, setPaymentId] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const generatePix = useCallback(async () => {
    setState("loading")
    setQrCode("")
    setQrCodeBase64("")
    setPaymentId("")

    try {
      const res = await fetch("/api/mercadopago/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro ao gerar Pix")

      setQrCode(data.qrCode)
      setQrCodeBase64(data.qrCodeBase64)
      setPaymentId(String(data.paymentId))
      setState("ready")
    } catch (err) {
      console.error("[PixModal] Erro:", err)
      setState("error")
    }
  }, [planId])

  // Gera o Pix ao abrir o modal
  useEffect(() => {
    if (open) generatePix()
  }, [open, generatePix])

  // Polling de status a cada 5s quando pronto
  useEffect(() => {
    if (!paymentId || (state !== "ready" && state !== "polling")) return

    const interval = setInterval(async () => {
      setState("polling")
      try {
        const res = await fetch(`/api/mercadopago/status?id=${paymentId}`)
        const data = await res.json()
        if (data.status === "approved") {
          setState("approved")
          clearInterval(interval)
          toast.success("Pagamento aprovado! Ativando sua licenca...")
          setTimeout(() => {
            router.push("/planos/sucesso")
            router.refresh()
          }, 1500)
        } else if (data.status === "rejected" || data.status === "cancelled") {
          setState("error")
          clearInterval(interval)
        } else {
          setState("ready")
        }
      } catch {
        setState("ready")
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [paymentId, state, router])

  function handleCopy() {
    navigator.clipboard.writeText(qrCode)
    setCopied(true)
    toast.success("Codigo Pix copiado!")
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">Pagar com Pix</DialogTitle>
        </DialogHeader>

        {/* Info do plano */}
        <div className="flex items-center justify-between rounded-lg bg-muted/30 border border-border px-4 py-3 -mt-2">
          <span className="text-sm text-muted-foreground">{planName}</span>
          <span className="text-base font-bold text-foreground">{planPrice}</span>
        </div>

        {/* Loading */}
        {state === "loading" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gerando QR Code Pix...</p>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-sm text-destructive text-center">Nao foi possivel gerar o Pix. Tente novamente.</p>
            <Button variant="outline" onClick={generatePix} className="gap-2">
              <RefreshCw className="size-4" /> Tentar novamente
            </Button>
          </div>
        )}

        {/* QR Code pronto */}
        {(state === "ready" || state === "polling") && qrCodeBase64 && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl border-2 border-border bg-white p-3 shadow-sm">
              <Image
                src={`data:image/png;base64,${qrCodeBase64}`}
                alt="QR Code Pix"
                width={200}
                height={200}
                className="block"
              />
            </div>

            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-1.5 text-center">Ou copie o codigo Pix copia e cola:</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted/30 border border-border rounded-md px-3 py-2 text-xs text-muted-foreground font-mono truncate">
                  {qrCode}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? <CheckCircle className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Aguardando confirmacao do pagamento...
            </div>
          </div>
        )}

        {/* Aprovado */}
        {state === "approved" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle className="size-12 text-green-500" />
            <p className="text-base font-semibold text-foreground">Pagamento aprovado!</p>
            <p className="text-sm text-muted-foreground">Ativando sua licenca...</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center -mt-1">
          Pagamento processado com seguranca pelo Mercado Pago.
        </p>
      </DialogContent>
    </Dialog>
  )
}

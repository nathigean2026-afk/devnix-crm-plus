"use client"

import { useCallback, useEffect, useState } from "react"
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCheckoutSession } from "@/app/actions/stripe"
import { X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutModalProps {
  planId: string
  planName: string
  onClose: () => void
}

export function CheckoutModal({ planId, planName, onClose }: CheckoutModalProps) {
  const router = useRouter()
  const [checkoutComplete, setCheckoutComplete] = useState(false)

  const fetchClientSecret = useCallback(
    () => startCheckoutSession(planId),
    [planId]
  )

  // Quando o EmbeddedCheckout dispara onComplete, redireciona para /planos/sucesso
  function handleComplete() {
    setCheckoutComplete(true)
    router.push("/planos/sucesso")
  }

  // Fecha com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pagamento seguro</p>
            <p className="text-base font-semibold text-gray-900">{planName}</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Checkout embed */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {checkoutComplete ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm text-gray-600">Redirecionando...</p>
            </div>
          ) : (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{
                fetchClientSecret,
                onComplete: handleComplete,
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          <p className="text-xs text-gray-400 text-center">
            Pagamento processado com seguranca pelo Stripe. Suportamos cartao de credito e Pix.
          </p>
        </div>
      </div>
    </div>
  )
}

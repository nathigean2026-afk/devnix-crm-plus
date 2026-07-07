"use client"

import { useEffect, useState } from "react"
import { Bell, X, BellOff } from "lucide-react"
import { cn } from "@/lib/utils"

// Converte chave VAPID base64url → Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

async function saveSubscription(sub: PushSubscription) {
  const subJson = sub.toJSON()
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
  })
  return res.ok
}

async function subscribeUser(): Promise<"granted" | "denied" | "unsupported" | "error"> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported"
  }

  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
    if (!vapidKey) return "error"

    const registration = await navigator.serviceWorker.ready

    // Verifica se já tem subscription
    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      await saveSubscription(existing)
      return "granted"
    }

    // Pede permissão
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return "denied"

    // Cria subscription
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
    await saveSubscription(sub)
    return "granted"
  } catch {
    return "error"
  }
}

type BannerState = "idle" | "loading" | "granted" | "denied" | "unsupported"

export function PushPermissionBanner() {
  const [state, setState] = useState<BannerState>("idle")
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Não mostra em navegadores sem suporte
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return

    // Já concedeu em sessão anterior
    if (localStorage.getItem("push-permission-granted") === "1") return

    // Já negou e optou por não mostrar mais
    if (localStorage.getItem("push-permission-dismissed") === "1") return

    // Permissão já concedida no navegador
    if (Notification.permission === "granted") {
      localStorage.setItem("push-permission-granted", "1")
      // Garante que a subscription está salva no banco
      navigator.serviceWorker.ready.then(async (reg) => {
        const existing = await reg.pushManager.getSubscription()
        if (existing) await saveSubscription(existing)
      })
      return
    }

    // Mostra o banner após 1.5s para não ser agressivo imediatamente
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [])

  const handleActivate = async () => {
    setState("loading")
    const result = await subscribeUser()
    setState(result === "granted" ? "granted" : result === "denied" ? "denied" : "error" as BannerState)

    if (result === "granted") {
      localStorage.setItem("push-permission-granted", "1")
      // Fecha após 2.5s
      setTimeout(() => setVisible(false), 2500)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem("push-permission-dismissed", "1")
    setVisible(false)
  }

  if (!mounted || !visible) return null

  return (
    <div
      className={cn(
        "fixed bottom-5 left-1/2 -translate-x-1/2 z-[9998] w-full max-w-md px-4",
        "transition-all duration-500 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
      role="alertdialog"
      aria-label="Ativar notificacoes"
    >
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#111827]">
        {/* Barra colorida no topo por estado */}
        <div className={cn(
          "h-1 w-full",
          state === "granted" ? "bg-emerald-500" :
          state === "denied"  ? "bg-red-500" :
          "bg-gradient-to-r from-violet-500 to-blue-500"
        )} />

        <div className="p-4">
          {state === "granted" ? (
            <div className="flex items-center gap-3">
              <div className="shrink-0 size-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Bell className="size-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Notificacoes ativadas!</p>
                <p className="text-xs text-white/50 mt-0.5">Voce receberá avisos importantes do sistema.</p>
              </div>
            </div>
          ) : state === "denied" ? (
            <div className="flex items-center gap-3">
              <div className="shrink-0 size-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                <BellOff className="size-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Permissao negada</p>
                <p className="text-xs text-white/50 mt-0.5">
                  Para ativar, clique no cadeado na barra de endereco do navegador.
                </p>
              </div>
              <button onClick={handleDismiss} className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-colors">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="shrink-0 size-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <Bell className="size-5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Ativar notificacoes</p>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                  Receba alertas de manutencao, novidades e avisos importantes do sistema em tempo real.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleActivate}
                    disabled={state === "loading"}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all active:scale-95",
                      state === "loading"
                        ? "bg-violet-600/60 cursor-wait"
                        : "bg-violet-600 hover:bg-violet-500"
                    )}
                  >
                    <Bell className="size-3.5" />
                    {state === "loading" ? "Ativando..." : "Ativar agora"}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-2 rounded-lg text-xs text-white/35 hover:text-white/60 transition-colors"
                  >
                    Agora nao
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

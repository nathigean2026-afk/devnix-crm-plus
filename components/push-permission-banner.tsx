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

// Aguarda o SW ficar pronto com timeout
async function waitForSW(timeoutMs = 8000): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("SW timeout")), timeoutMs)
    navigator.serviceWorker.ready.then((reg) => {
      clearTimeout(timer)
      resolve(reg)
    }).catch((err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

async function subscribeUser(): Promise<"granted" | "denied" | "unsupported" | "error"> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported"
  }

  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
    if (!vapidKey) return "error"

    // Registra o SW se ainda não estiver registrado
    if (!navigator.serviceWorker.controller) {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      } catch {
        // Continua — pode já estar registrado
      }
    }

    // Aguarda o SW com timeout de 8s para não travar
    let registration: ServiceWorkerRegistration
    try {
      registration = await waitForSW(8000)
    } catch {
      return "error"
    }

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

type BannerState = "idle" | "loading" | "granted" | "denied" | "error" | "unsupported"

export function PushPermissionBanner() {
  const [state, setState] = useState<BannerState>("idle")
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Não mostra em navegadores sem suporte
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return

    // Usuário explicitamente dispensou o banner e não quer ver mais
    if (localStorage.getItem("push-permission-dismissed") === "1") return

    // Já concedeu em sessão anterior
    if (localStorage.getItem("push-permission-granted") === "1") return

    // Permissão já concedida no navegador
    if (Notification.permission === "granted") {
      localStorage.setItem("push-permission-granted", "1")
      // Garante que a subscription está salva no banco
      navigator.serviceWorker.ready.then(async (reg) => {
        const existing = await reg.pushManager.getSubscription()
        if (existing) await saveSubscription(existing)
      }).catch(() => { /* silencioso */ })
      return
    }

    // Mostra o banner após 1.5s para não ser agressivo imediatamente
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [])

  const handleActivate = async () => {
    setState("loading")
    const result = await subscribeUser()

    if (result === "granted") {
      setState("granted")
      localStorage.setItem("push-permission-granted", "1")
      // Fecha após 2.5s
      setTimeout(() => setVisible(false), 2500)
    } else if (result === "denied") {
      setState("denied")
    } else {
      // "error" ou "unsupported" — mostra mensagem amigável e fecha em 4s
      setState("error")
      setTimeout(() => setVisible(false), 4000)
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
      aria-label="Ativar notificações"
    >
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#111827]">
        {/* Barra colorida no topo por estado */}
        <div className={cn(
          "h-1 w-full",
          state === "granted" ? "bg-emerald-500" :
          state === "denied" || state === "error"  ? "bg-red-500" :
          "bg-gradient-to-r from-violet-500 to-blue-500"
        )} />

        <div className="p-4">
          {state === "granted" ? (
            <div className="flex items-center gap-3">
              <div className="shrink-0 size-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Bell className="size-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Notificações ativadas!</p>
                <p className="text-xs text-white/50 mt-0.5">Você receberá avisos importantes do sistema.</p>
              </div>
            </div>
          ) : state === "denied" ? (
            <div className="flex items-center gap-3">
              <div className="shrink-0 size-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                <BellOff className="size-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Permissão negada</p>
                <p className="text-xs text-white/50 mt-0.5">
                  Para ativar, clique no cadeado na barra de endereço do navegador.
                </p>
              </div>
              <button onClick={handleDismiss} className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-colors">
                <X className="size-4" />
              </button>
            </div>
          ) : state === "error" ? (
            <div className="flex items-center gap-3">
              <div className="shrink-0 size-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <BellOff className="size-5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Não foi possível ativar</p>
                <p className="text-xs text-white/50 mt-0.5">
                  Verifique se seu navegador suporta notificações e tente novamente.
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
                <p className="text-sm font-semibold text-white">Ativar notificações</p>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                  Receba alertas de manutenção, novidades e avisos importantes do sistema em tempo real.
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
                    Agora não
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

// Componente auxiliar exportado para a página de Configurações
// Permite ao usuário reativar o banner que ele dispensou com "Agora não"
export function PushNotificationToggle() {
  const [dismissed, setDismissed] = useState(false)
  const [granted, setGranted] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDismissed(localStorage.getItem("push-permission-dismissed") === "1")
    setGranted(
      localStorage.getItem("push-permission-granted") === "1" ||
      (typeof Notification !== "undefined" && Notification.permission === "granted")
    )
  }, [])

  if (!mounted) return null
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return (
      <p className="text-xs text-muted-foreground">
        Seu navegador não suporta notificações push.
      </p>
    )
  }

  const handleActivateNow = async () => {
    setActivating(true)
    // Remove o flag de dispensado para que o banner apareça
    localStorage.removeItem("push-permission-dismissed")
    const result = await subscribeUser()
    setActivating(false)
    if (result === "granted") {
      localStorage.setItem("push-permission-granted", "1")
      setGranted(true)
      setDismissed(false)
    } else if (result === "denied") {
      // Deixa o estado, mostra mensagem ao usuário via estado
    }
  }

  const handleDisable = () => {
    localStorage.setItem("push-permission-dismissed", "1")
    setDismissed(true)
  }

  if (granted && Notification.permission === "granted") {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
          <Bell className="size-3.5" />
          Notificações push ativas neste dispositivo
        </p>
        <button
          onClick={handleDisable}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Desativar
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground">
        {dismissed
          ? "Você dispensou o aviso. Clique para ativar notificações neste dispositivo."
          : "Receba alertas em tempo real no seu navegador."}
      </p>
      <button
        onClick={handleActivateNow}
        disabled={activating}
        className="shrink-0 flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-wait"
      >
        <Bell className="size-3" />
        {activating ? "Ativando..." : "Ativar agora"}
      </button>
    </div>
  )
}

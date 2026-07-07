"use client"

import { useEffect } from "react"

// Componente silencioso — sem UI
// Pede permissão de notificação e registra a subscription no banco
export function PushSubscriptionManager() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) return

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    async function subscribe() {
      try {
        const registration = await navigator.serviceWorker.ready

        // Verifica se já existe subscription ativa
        const existing = await registration.pushManager.getSubscription()
        if (existing) {
          // Garante que está salva no banco (pode ter sido perdida)
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpoint: existing.endpoint,
              keys: {
                p256dh: btoa(String.fromCharCode(...new Uint8Array(existing.getKey("p256dh")!))),
                auth: btoa(String.fromCharCode(...new Uint8Array(existing.getKey("auth")!))),
              },
            }),
          })
          return
        }

        // Pede permissão ao usuário
        const permission = await Notification.requestPermission()
        if (permission !== "granted") return

        // Cria nova subscription
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey!),
        })

        // Salva no banco
        const subJson = sub.toJSON()
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        })
      } catch (err) {
        // Silencioso — não exibe erro para o usuário
        console.error("[push] Erro ao registrar subscription:", err)
      }
    }

    // Aguarda o SW estar pronto antes de pedir permissão
    if (navigator.serviceWorker.controller) {
      subscribe()
    } else {
      navigator.serviceWorker.addEventListener("controllerchange", () => subscribe())
    }
  }, [])

  return null
}

// Converte a chave VAPID base64url para Uint8Array (exigido pela Web Push API)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
